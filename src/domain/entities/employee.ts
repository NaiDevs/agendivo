import type { SyncableEntity } from "@/domain/entities/syncable-entity";

export interface Employee extends SyncableEntity {
  businessId: string;
  name: string;
  phone: string | null;
  email: string | null;
  color: string;
}
