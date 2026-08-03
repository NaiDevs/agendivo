import type { Business } from "@/domain/entities/business";
import type { BusinessRepository } from "@/domain/repositories/business.repository";
import {
  businessFormSchema,
  type BusinessFormValues,
} from "@/schemas/business.schema";

function optionalText(value: string): string | null {
  return value === "" ? null : value;
}

export async function createBusiness(
  values: BusinessFormValues,
  deviceId: string,
  repository: BusinessRepository,
): Promise<Business> {
  const input = businessFormSchema.parse(values);
  const now = new Date().toISOString();
  const business: Business = {
    id: crypto.randomUUID(),
    name: input.name,
    phone: optionalText(input.phone),
    email: optionalText(input.email),
    address: optionalText(input.address),
    timezone: input.timezone,
    currency: input.currency,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    version: 1,
    deviceId,
  };

  await repository.create(business);

  return business;
}
