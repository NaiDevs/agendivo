import type { Employee } from "@/domain/entities/employee";

export interface EmployeeRepository {
  findActiveByBusiness(businessId: string): Promise<Employee[]>;
  create(employee: Employee): Promise<void>;
}
