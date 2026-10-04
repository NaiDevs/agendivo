import type { Subscription } from "@/domain/entities/subscription";

export interface SubscriptionRepository {
  createCheckout: (businessId: string) => Promise<string | null>;
  ensureBusiness: (businessId: string, businessName: string) => Promise<void>;
  findByBusiness: (businessId: string) => Promise<Subscription | null>;
}
