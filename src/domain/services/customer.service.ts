import type { Customer } from "@/domain/entities/customer";
import type { CustomerRepository } from "@/domain/repositories/customer.repository";
import {
  customerFormSchema,
  type CustomerFormValues,
} from "@/schemas/customer.schema";

function optionalText(value: string): string | null {
  return value === "" ? null : value;
}

export async function createCustomer(
  values: CustomerFormValues,
  businessId: string,
  deviceId: string,
  repository: CustomerRepository,
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
): Promise<Customer> {
  const input = customerFormSchema.parse(values);
  const customer: Customer = {
    ...current,
    name: input.name,
    phone: optionalText(input.phone),
    email: optionalText(input.email),
    notes: optionalText(input.notes),
    updatedAt: new Date().toISOString(),
    version: current.version + 1,
  };
  await repository.update(customer);
  return customer;
}
