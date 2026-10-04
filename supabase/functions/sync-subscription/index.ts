import { createClient } from "npm:@supabase/supabase-js@2.111.0";
import Stripe from "npm:stripe@22.4.0";

import { corsHeaders, jsonResponse } from "../_shared/http.ts";

interface SyncSubscriptionRequest {
  businessId: string;
}

function readRequest(value: unknown): SyncSubscriptionRequest | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("businessId" in value) ||
    typeof value.businessId !== "string" ||
    value.businessId.trim() === ""
  ) {
    return null;
  }

  return { businessId: value.businessId };
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  if (request.method !== "POST") {
    return jsonResponse(request, 405, { error: "METHOD_NOT_ALLOWED" });
  }

  const authorization = request.headers.get("authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (
    authorization === null ||
    supabaseUrl === undefined ||
    publishableKey === undefined ||
    serviceRoleKey === undefined ||
    stripeSecretKey === undefined
  ) {
    return jsonResponse(request, 503, { error: "BILLING_NOT_CONFIGURED" });
  }

  const input = readRequest(await request.json().catch((): null => null));
  if (input === null) {
    return jsonResponse(request, 400, { error: "INVALID_REQUEST" });
  }

  const userClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError !== null || userData.user === null) {
    return jsonResponse(request, 401, { error: "INVALID_SESSION" });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: membership, error: membershipError } = await adminClient
    .from("business_members")
    .select("business_id")
    .eq("business_id", input.businessId)
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (membershipError !== null || membership === null) {
    return jsonResponse(request, 403, { error: "SUBSCRIPTION_FORBIDDEN" });
  }

  const { data: storedSubscription, error: lookupError } = await adminClient
    .from("subscriptions")
    .select("stripe_customer_id, stripe_subscription_id")
    .eq("business_id", input.businessId)
    .maybeSingle();
  if (lookupError !== null) {
    return jsonResponse(request, 500, { error: "SUBSCRIPTION_LOOKUP_FAILED" });
  }
  if (
    storedSubscription === null ||
    storedSubscription.stripe_customer_id === null
  ) {
    return jsonResponse(request, 200, { synced: false });
  }

  try {
    const stripe = new Stripe(stripeSecretKey);
    const subscriptions = await stripe.subscriptions.list({
      customer: storedSubscription.stripe_customer_id,
      limit: 100,
      status: "all",
    });
    const newestSubscriptions = [...subscriptions.data].sort(
      (left, right) => right.created - left.created,
    );
    const subscription =
      newestSubscriptions.find((candidate) => candidate.status === "active") ??
      newestSubscriptions.find(
        (candidate) => candidate.status === "trialing",
      ) ??
      newestSubscriptions[0];
    if (subscription === undefined) {
      return jsonResponse(request, 200, { synced: false });
    }

    const firstItem = subscription.items.data[0];
    const { error: updateError } = await adminClient
      .from("subscriptions")
      .update({
        stripe_customer_id:
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id,
        stripe_subscription_id: subscription.id,
        stripe_price_id: firstItem?.price.id,
        status: subscription.status,
        current_period_end:
          firstItem === undefined
            ? null
            : new Date(firstItem.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
      })
      .eq("business_id", input.businessId);
    if (updateError !== null) {
      return jsonResponse(request, 500, {
        error: "SUBSCRIPTION_UPDATE_FAILED",
      });
    }

    return jsonResponse(request, 200, { synced: true });
  } catch {
    return jsonResponse(request, 502, { error: "STRIPE_SYNC_FAILED" });
  }
});
