import type { Service } from "@/domain/entities/service";

export interface ServiceRepository {
  findActiveByBusiness(businessId: string): Promise<Service[]>;
  create(service: Service): Promise<void>;
  update(service: Service): Promise<void>;
}
