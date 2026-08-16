import {
  EMPLOYEE_ACCOUNT_ROLE,
  type Employee,
  type EmployeeAccountRole,
} from "@/domain/entities/employee";
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
  account?: { id?: string; role: EmployeeAccountRole; userId: string },
): Promise<Employee> {
  const input = employeeFormSchema.parse(values);
  const now = new Date().toISOString();
  const employee: Employee = {
    id: account?.id ?? crypto.randomUUID(),
    businessId,
    name: input.name,
    phone: optionalText(input.phone),
    email: optionalText(input.email),
    color: "copper",
    userId: account?.userId ?? null,
    accountRole: account?.role ?? EMPLOYEE_ACCOUNT_ROLE.EMPLOYEE,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    version: 1,
    deviceId,
  };

  await repository.create(employee);
  return employee;
}

export async function updateEmployee(
  current: Employee,
  values: EmployeeFormValues,
  repository: EmployeeRepository,
): Promise<Employee> {
  const input = employeeFormSchema.parse(values);
  const employee: Employee = {
    ...current,
    name: input.name,
    phone: optionalText(input.phone),
    email: optionalText(input.email),
    updatedAt: new Date().toISOString(),
    version: current.version + 1,
  };
  await repository.update(employee);
  return employee;
}
