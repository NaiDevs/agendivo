import type { Customer } from "@/domain/entities/customer";

export interface CustomerRepository {
  findActiveByBusiness(businessId: string): Promise<Customer[]>;
  create(customer: Customer): Promise<void>;
}
