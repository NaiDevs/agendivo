import type { SyncableEntity } from "@/domain/entities/syncable-entity";

export interface Service extends SyncableEntity {
  businessId: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
}
