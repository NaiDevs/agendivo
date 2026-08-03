import type { SyncableEntity } from "@/domain/entities/syncable-entity";

export interface Customer extends SyncableEntity {
  businessId: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
}
