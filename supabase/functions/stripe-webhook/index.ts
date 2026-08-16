import { createClient } from "npm:@supabase/supabase-js@2.111.0";
import Stripe from "npm:stripe@22.4.0";

import { jsonResponse } from "../_shared/http.ts";

function unixTimestamp(value: number | null): string | null {
  return value === null ? null : new Date(value * 1000).toISOString();
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method !== "POST") {
    return jsonResponse(request, 405, { error: "METHOD_NOT_ALLOWED" });
  }

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const signature = request.headers.get("stripe-signature");

  if (
    stripeSecretKey === undefined ||
    webhookSecret === undefined ||
    supabaseUrl === undefined ||
    serviceRoleKey === undefined ||
    signature === null
  ) {
    return jsonResponse(request, 503, { error: "WEBHOOK_NOT_CONFIGURED" });
  }

  const stripe = new Stripe(stripeSecretKey);
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      await request.text(),
      signature,
      webhookSecret,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch {
    return jsonResponse(request, 400, { error: "INVALID_SIGNATURE" });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: processed } = await adminClient
    .from("stripe_webhook_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();
  if (processed !== null) {
    return jsonResponse(request, 200, { received: true });
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object;
    const businessId = subscription.metadata.business_id;
    if (businessId === undefined) {
      return jsonResponse(request, 400, {
        error: "BUSINESS_METADATA_REQUIRED",
      });
    }

    const firstItem = subscription.items.data[0];
    const { error } = await adminClient.from("subscriptions").upsert(
      {
        business_id: businessId,
        stripe_customer_id:
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id,
        stripe_subscription_id: subscription.id,
        stripe_price_id: firstItem?.price.id ?? Deno.env.get("STRIPE_PRICE_ID"),
        status: subscription.status,
        current_period_end: unixTimestamp(
          firstItem?.current_period_end ?? null,
        ),
        cancel_at_period_end: subscription.cancel_at_period_end,
      },
      { onConflict: "business_id" },
    );
    if (error !== null) {
      return jsonResponse(request, 500, {
        error: "SUBSCRIPTION_UPDATE_FAILED",
      });
    }
  }

  const { error: eventError } = await adminClient
    .from("stripe_webhook_events")
    .insert({ id: event.id, event_type: event.type });
  if (eventError !== null) {
    return jsonResponse(request, 500, { error: "EVENT_REGISTRATION_FAILED" });
  }

  return jsonResponse(request, 200, { received: true });
});
