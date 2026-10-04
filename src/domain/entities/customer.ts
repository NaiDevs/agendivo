import type { SyncableEntity } from "@/domain/entities/syncable-entity";
import type { CustomerCustomFieldValues } from "@/domain/entities/customer-custom-field";

export interface Customer extends SyncableEntity {
  businessId: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  customFieldValues: CustomerCustomFieldValues;
}
