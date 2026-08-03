import type { Business } from "@/domain/entities/business";

export interface BusinessRepository {
  findActive(): Promise<Business | null>;
  create(business: Business): Promise<void>;
}
