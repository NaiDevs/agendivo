import { describe, expect, it } from "vitest";

import {
  hasPaidSubscription,
  SUBSCRIPTION_STATUS,
  type Subscription,
  type SubscriptionStatus,
} from "@/domain/entities/subscription";

function subscriptionWithStatus(status: SubscriptionStatus): Subscription {
  return {
    businessId: "17ea3356-85ed-420a-b1cf-3f9406b0571c",
    cancelAtPeriodEnd: false,
    currentPeriodEnd: null,
    status,
    stripePriceId: "price_agendivo",
  };
}

describe("hasPaidSubscription", () => {
  it("habilita el acceso cuando Stripe confirma el pago", () => {
    expect(
      hasPaidSubscription(subscriptionWithStatus(SUBSCRIPTION_STATUS.ACTIVE)),
    ).toBe(true);
  });

  it.each([
    SUBSCRIPTION_STATUS.CHECKOUT_PENDING,
    SUBSCRIPTION_STATUS.INCOMPLETE,
    SUBSCRIPTION_STATUS.PAST_DUE,
    SUBSCRIPTION_STATUS.CANCELED,
    SUBSCRIPTION_STATUS.TRIALING,
  ])("mantiene bloqueado el acceso con estado %s", (status) => {
    expect(hasPaidSubscription(subscriptionWithStatus(status))).toBe(false);
  });

  it("mantiene bloqueada una cuenta sin suscripción", () => {
    expect(hasPaidSubscription(null)).toBe(false);
  });

  it("bloquea el acceso desde que la cancelación queda programada", () => {
    const subscription = subscriptionWithStatus(SUBSCRIPTION_STATUS.ACTIVE);
    subscription.cancelAtPeriodEnd = true;

    expect(hasPaidSubscription(subscription)).toBe(false);
  });

  it("bloquea una suscripción cuyo periodo ya terminó", () => {
    const subscription = subscriptionWithStatus(SUBSCRIPTION_STATUS.ACTIVE);
    subscription.currentPeriodEnd = "2020-01-01T00:00:00.000Z";

    expect(hasPaidSubscription(subscription)).toBe(false);
  });
});
