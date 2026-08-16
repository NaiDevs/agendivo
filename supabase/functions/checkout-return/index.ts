import { createClient } from "npm:@supabase/supabase-js@2.111.0";
import Stripe from "npm:stripe@22.4.0";

type CheckoutStatus = "cancel" | "success";

function readStatus(value: string | null): CheckoutStatus {
  return value === "success" ? "success" : "cancel";
}

function redirectToApp(status: CheckoutStatus): Response {
  return new Response(null, {
    status: 302,
    headers: {
      "Cache-Control": "no-store",
      Location: `agendivo://billing/return?status=${status}`,
    },
  });
}

Deno.serve(async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const status = readStatus(url.searchParams.get("status"));
  const sessionId = url.searchParams.get("session_id");

  if (status !== "success" || sessionId === null) {
    return redirectToApp(status);
  }

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (
    stripeSecretKey === undefined ||
    supabaseUrl === undefined ||
    serviceRoleKey === undefined
  ) {
    return redirectToApp("cancel");
  }

  try {
    const stripe = new Stripe(stripeSecretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });
    const businessId =
      session.metadata?.business_id ?? session.client_reference_id;
    const subscription = session.subscription;
    if (
      session.status !== "complete" ||
      businessId === null ||
      businessId === undefined ||
      subscription === null ||
      typeof subscription === "string"
    ) {
      return redirectToApp("cancel");
    }

    const firstItem = subscription.items.data[0];
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
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
        current_period_end:
          firstItem === undefined
            ? null
            : new Date(firstItem.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
      },
      { onConflict: "business_id" },
    );
    return redirectToApp(error === null ? "success" : "cancel");
  } catch {
    return redirectToApp("cancel");
  }
});
