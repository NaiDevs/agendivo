import { describe, expect, it } from "vitest";

import { validateStripeCheckoutUrl } from "@/infrastructure/billing/checkout-url";

describe("validateStripeCheckoutUrl", () => {
  it("acepta URLs HTTPS del checkout oficial de Stripe", () => {
    expect(
      validateStripeCheckoutUrl("https://checkout.stripe.com/c/pay/test"),
    ).toBe("https://checkout.stripe.com/c/pay/test");
  });

  it.each([
    "http://checkout.stripe.com/c/pay/test",
    "https://checkout.stripe.com.example.com/c/pay/test",
    "https://usuario:clave@checkout.stripe.com/c/pay/test",
    "agendivo://billing/return",
    "sin-url",
  ])("rechaza una URL de checkout no permitida: %s", (value: string) => {
    expect(() => validateStripeCheckoutUrl(value)).toThrow();
  });
});
