import type { SyncableEntity } from "@/domain/entities/syncable-entity";

export interface Business extends SyncableEntity {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  timezone: string;
  currency: string;
}
