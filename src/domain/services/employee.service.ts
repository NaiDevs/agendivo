import type { Employee } from "@/domain/entities/employee";
import type { EmployeeRepository } from "@/domain/repositories/employee.repository";
import {
  employeeFormSchema,
  type EmployeeFormValues,
} from "@/schemas/employee.schema";

function optionalText(value: string): string | null {
  return value === "" ? null : value;
}

export async function createEmployee(
  values: EmployeeFormValues,
  businessId: string,
  deviceId: string,
  repository: EmployeeRepository,
): Promise<Employee> {
  const input = employeeFormSchema.parse(values);
  const now = new Date().toISOString();
  const employee: Employee = {
    id: crypto.randomUUID(),
    businessId,
    name: input.name,
    phone: optionalText(input.phone),
    email: optionalText(input.email),
    color: "copper",
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    version: 1,
    deviceId,
  };

  await repository.create(employee);
  return employee;
}
