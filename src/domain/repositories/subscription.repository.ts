import type { Subscription } from "@/domain/entities/subscription";

export interface SubscriptionRepository {
  createCheckout: (businessId: string) => Promise<string | null>;
  findByBusiness: (businessId: string) => Promise<Subscription | null>;
}
