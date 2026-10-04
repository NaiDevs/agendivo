import type { CustomerCustomField } from "@/domain/entities/customer-custom-field";

export interface CustomerCustomFieldRepository {
  findActiveByBusiness(businessId: string): Promise<CustomerCustomField[]>;
  create(field: CustomerCustomField): Promise<void>;
  update(field: CustomerCustomField): Promise<void>;
}
