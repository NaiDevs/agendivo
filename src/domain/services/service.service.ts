import type { Service } from "@/domain/entities/service";
import type { ServiceRepository } from "@/domain/repositories/service.repository";
import {
  serviceFormSchema,
  type ServiceFormValues,
} from "@/schemas/service.schema";

export async function createService(
  values: ServiceFormValues,
  businessId: string,
  deviceId: string,
  repository: ServiceRepository,
): Promise<Service> {
  const input = serviceFormSchema.parse(values);
  const now = new Date().toISOString();
  const service: Service = {
    id: crypto.randomUUID(),
    businessId,
    name: input.name,
    description: input.description === "" ? null : input.description,
    durationMinutes: input.durationMinutes,
    price: Math.round(input.price * 100),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    version: 1,
    deviceId,
  };

  await repository.create(service);
  return service;
}
