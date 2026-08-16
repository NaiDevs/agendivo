export const SUBSCRIPTION_STATUS = {
  ACTIVE: "active",
  CANCELED: "canceled",
  CHECKOUT_PENDING: "checkout_pending",
  INCOMPLETE: "incomplete",
  INCOMPLETE_EXPIRED: "incomplete_expired",
  PAST_DUE: "past_due",
  PAUSED: "paused",
  TRIALING: "trialing",
  UNPAID: "unpaid",
} as const;

export type SubscriptionStatus =
  (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];

export interface Subscription {
  businessId: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  status: SubscriptionStatus;
  stripePriceId: string;
}
