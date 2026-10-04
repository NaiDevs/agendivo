import { z } from "zod";

import type { Customer } from "@/domain/entities/customer";
import {
  CUSTOMER_CUSTOM_FIELD_TYPE,
  type CustomerCustomField,
  type CustomerCustomFieldValue,
  type CustomerCustomFieldValues,
} from "@/domain/entities/customer-custom-field";
import type { CustomerRepository } from "@/domain/repositories/customer.repository";
import {
  customerFormSchema,
  type CustomerFormValues,
} from "@/schemas/customer.schema";

function optionalText(value: string): string | null {
  return value === "" ? null : value;
}

function isEmptyCustomValue(
  value: CustomerCustomFieldValue | undefined,
): boolean {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
}

function normalizeCustomFieldValue(
  field: CustomerCustomField,
  value: CustomerCustomFieldValue | undefined,
): CustomerCustomFieldValue {
  if (isEmptyCustomValue(value)) {
    if (field.isRequired) {
      throw new Error(`${field.name} es obligatorio.`);
    }
    return field.isMultiple ? [] : null;
  }

  switch (field.type) {
    case CUSTOMER_CUSTOM_FIELD_TYPE.BOOLEAN:
      if (typeof value !== "boolean") break;
      return value;
    case CUSTOMER_CUSTOM_FIELD_TYPE.NUMBER:
      if (typeof value !== "number" || !Number.isFinite(value)) break;
      return value;
    case CUSTOMER_CUSTOM_FIELD_TYPE.DATETIME:
      if (typeof value !== "string" || Number.isNaN(Date.parse(value))) break;
      return new Date(value).toISOString();
    case CUSTOMER_CUSTOM_FIELD_TYPE.EMAIL:
      if (
        typeof value !== "string" ||
        !z.email().safeParse(value.trim()).success
      )
        break;
      return value.trim();
    case CUSTOMER_CUSTOM_FIELD_TYPE.SELECT:
      if (field.isMultiple) {
        if (
          !Array.isArray(value) ||
          value.some((option) => !field.options.includes(option))
        )
          break;
        return value;
      }
      if (typeof value !== "string" || !field.options.includes(value)) break;
      return value;
    case CUSTOMER_CUSTOM_FIELD_TYPE.TELEPHONE:
    case CUSTOMER_CUSTOM_FIELD_TYPE.TEXT:
      if (typeof value !== "string") break;
      return value.trim();
  }

  throw new Error(`${field.name} tiene un valor inválido.`);
}

function normalizeCustomFieldValues(
  values: CustomerCustomFieldValues,
  fields: CustomerCustomField[],
): CustomerCustomFieldValues {
  return Object.fromEntries(
    fields.map((field) => [
      field.id,
      normalizeCustomFieldValue(field, values[field.id]),
    ]),
  );
}

export async function createCustomer(
  values: CustomerFormValues,
  businessId: string,
  deviceId: string,
  repository: CustomerRepository,
  customFields: CustomerCustomField[] = [],
): Promise<Customer> {
  const input = customerFormSchema.parse(values);
  const now = new Date().toISOString();
  const customer: Customer = {
    id: crypto.randomUUID(),
    businessId,
    name: input.name,
    phone: optionalText(input.phone),
    email: optionalText(input.email),
    notes: optionalText(input.notes),
    customFieldValues: normalizeCustomFieldValues(
      input.customFieldValues,
      customFields,
    ),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    version: 1,
    deviceId,
  };

  await repository.create(customer);

  return customer;
}

export async function updateCustomer(
  current: Customer,
  values: CustomerFormValues,
  repository: CustomerRepository,
  customFields: CustomerCustomField[] = [],
): Promise<Customer> {
  const input = customerFormSchema.parse(values);
  const customer: Customer = {
    ...current,
    name: input.name,
    phone: optionalText(input.phone),
    email: optionalText(input.email),
    notes: optionalText(input.notes),
    customFieldValues: {
      ...current.customFieldValues,
      ...normalizeCustomFieldValues(input.customFieldValues, customFields),
    },
    updatedAt: new Date().toISOString(),
    version: current.version + 1,
  };
  await repository.update(customer);
  return customer;
}
