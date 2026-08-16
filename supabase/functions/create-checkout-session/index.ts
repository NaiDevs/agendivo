import { createClient } from "npm:@supabase/supabase-js@2.111.0";
import Stripe from "npm:stripe@22.4.0";

import { corsHeaders, jsonResponse } from "../_shared/http.ts";

interface CheckoutRequest {
  businessId: string;
}

function readCheckoutRequest(value: unknown): CheckoutRequest | null {
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
  if (authorization === null) {
    return jsonResponse(request, 401, { error: "AUTH_REQUIRED" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  const stripePriceId = Deno.env.get("STRIPE_PRICE_ID");
  const successUrl = Deno.env.get("STRIPE_SUCCESS_URL");
  const cancelUrl = Deno.env.get("STRIPE_CANCEL_URL");

  if (
    supabaseUrl === undefined ||
    publishableKey === undefined ||
    serviceRoleKey === undefined ||
    stripeSecretKey === undefined ||
    stripePriceId === undefined ||
    successUrl === undefined ||
    cancelUrl === undefined
  ) {
    return jsonResponse(request, 503, { error: "BILLING_NOT_CONFIGURED" });
  }

  const input = readCheckoutRequest(
    await request.json().catch((): null => null),
  );
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
    .select("role")
    .eq("business_id", input.businessId)
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (
    membershipError !== null ||
    membership === null ||
    !["owner", "admin"].includes(membership.role)
  ) {
    return jsonResponse(request, 403, { error: "BILLING_FORBIDDEN" });
  }

  const { data: currentSubscription, error: subscriptionError } =
    await adminClient
      .from("subscriptions")
      .select("stripe_customer_id, status")
      .eq("business_id", input.businessId)
      .maybeSingle();

  if (subscriptionError !== null) {
    return jsonResponse(request, 500, { error: "SUBSCRIPTION_LOOKUP_FAILED" });
  }
  if (
    currentSubscription !== null &&
    ["active", "trialing"].includes(currentSubscription.status)
  ) {
    return jsonResponse(request, 409, { error: "SUBSCRIPTION_ALREADY_ACTIVE" });
  }

  const stripe = new Stripe(stripeSecretKey);
  let customerId = currentSubscription?.stripe_customer_id ?? null;
  if (customerId === null) {
    const customer = await stripe.customers.create({
      email: userData.user.email,
      metadata: { business_id: input.businessId },
    });
    customerId = customer.id;
  }

  const existingSubscriptions = await stripe.subscriptions.list({
    customer: customerId,
    limit: 10,
    status: "all",
  });
  const activeSubscription = existingSubscriptions.data.find(
    (subscription) =>
      subscription.status === "active" || subscription.status === "trialing",
  );
  if (activeSubscription !== undefined) {
    const firstItem = activeSubscription.items.data[0];
    const { error: reconcileError } = await adminClient
      .from("subscriptions")
      .upsert(
        {
          business_id: input.businessId,
          stripe_customer_id: customerId,
          stripe_subscription_id: activeSubscription.id,
          stripe_price_id: firstItem?.price.id ?? stripePriceId,
          status: activeSubscription.status,
          current_period_end:
            firstItem === undefined
              ? null
              : new Date(firstItem.current_period_end * 1000).toISOString(),
          cancel_at_period_end: activeSubscription.cancel_at_period_end,
        },
        { onConflict: "business_id" },
      );
    if (reconcileError !== null) {
      return jsonResponse(request, 500, {
        error: "SUBSCRIPTION_RECONCILIATION_FAILED",
      });
    }
    return jsonResponse(request, 200, { active: true, url: null });
  }

  const sessionReference = "{CHECKOUT_SESSION_ID}";
  const checkoutSuccessUrl = `${successUrl}${successUrl.includes("?") ? "&" : "?"}session_id=${sessionReference}`;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: input.businessId,
    line_items: [{ price: stripePriceId, quantity: 1 }],
    success_url: checkoutSuccessUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    metadata: { business_id: input.businessId },
    subscription_data: { metadata: { business_id: input.businessId } },
  });

  const { error: saveError } = await adminClient.from("subscriptions").upsert(
    {
      business_id: input.businessId,
      stripe_customer_id: customerId,
      stripe_price_id: stripePriceId,
      status: "checkout_pending",
    },
    { onConflict: "business_id" },
  );

  if (saveError !== null || session.url === null) {
    return jsonResponse(request, 500, { error: "CHECKOUT_CREATION_FAILED" });
  }

  return jsonResponse(request, 200, {
    active: false,
    url: session.url,
  });
});
