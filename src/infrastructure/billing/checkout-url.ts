const STRIPE_CHECKOUT_HOSTNAME = "checkout.stripe.com";

export function validateStripeCheckoutUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Stripe devolvió una URL de pago inválida.");
  }

  if (
    url.protocol !== "https:" ||
    url.hostname !== STRIPE_CHECKOUT_HOSTNAME ||
    url.username !== "" ||
    url.password !== ""
  ) {
    throw new Error("Stripe devolvió una URL de pago no permitida.");
  }

  return url.toString();
}
