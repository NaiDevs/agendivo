import type { CustomerCustomField } from "@/domain/entities/customer-custom-field";
import type { CustomerCustomFieldRepository } from "@/domain/repositories/customer-custom-field.repository";
import {
  customerCustomFieldFormSchema,
  type CustomerCustomFieldFormValues,
} from "@/schemas/customer-custom-field.schema";

export async function createCustomerCustomField(
  values: CustomerCustomFieldFormValues,
  businessId: string,
  deviceId: string,
  sortOrder: number,
  repository: CustomerCustomFieldRepository,
): Promise<CustomerCustomField> {
  const input = customerCustomFieldFormSchema.parse(values);
  const now = new Date().toISOString();
  const field: CustomerCustomField = {
    id: crypto.randomUUID(),
    businessId,
    name: input.name,
    type: input.type,
    isRequired: input.isRequired,
    isMultiple: input.isMultiple,
    options: input.options,
    sortOrder,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    version: 1,
    deviceId,
  };
  await repository.create(field);
  return field;
}

export async function updateCustomerCustomField(
  current: CustomerCustomField,
  values: CustomerCustomFieldFormValues,
  repository: CustomerCustomFieldRepository,
): Promise<CustomerCustomField> {
  const input = customerCustomFieldFormSchema.parse(values);
  const field: CustomerCustomField = {
    ...current,
    name: input.name,
    type: input.type,
    isRequired: input.isRequired,
    isMultiple: input.isMultiple,
    options: input.options,
    updatedAt: new Date().toISOString(),
    version: current.version + 1,
  };
  await repository.update(field);
  return field;
}

export async function deleteCustomerCustomField(
  current: CustomerCustomField,
  repository: CustomerCustomFieldRepository,
): Promise<CustomerCustomField> {
  const field: CustomerCustomField = {
    ...current,
    deletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: current.version + 1,
  };
  await repository.update(field);
  return field;
}
