import { z } from "zod";

import {
  EMPLOYEE_ACCOUNT_ROLE,
  type Employee,
} from "@/domain/entities/employee";
import type { EmployeeRepository } from "@/domain/repositories/employee.repository";
import type { DatabaseClient } from "@/infrastructure/database/database-client";

const employeeRowSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  name: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  color: z.string(),
  user_id: z.string().uuid().nullable(),
  account_role: z.enum([
    EMPLOYEE_ACCOUNT_ROLE.OWNER,
    EMPLOYEE_ACCOUNT_ROLE.EMPLOYEE,
  ]),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
  version: z.number().int().positive(),
  device_id: z.string().uuid(),
});

type EmployeeRow = z.infer<typeof employeeRowSchema>;

function mapEmployee(row: EmployeeRow): Employee {
  return {
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    color: row.color,
    userId: row.user_id,
    accountRole: row.account_role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    version: row.version,
    deviceId: row.device_id,
  };
}

export class SqliteEmployeeRepository implements EmployeeRepository {
  constructor(private readonly database: DatabaseClient) {}

  async findActiveByBusiness(businessId: string): Promise<Employee[]> {
    const rows = await this.database.select<unknown[]>(
      `SELECT id, business_id, name, phone, email, color, user_id, account_role,
              created_at, updated_at, deleted_at, version, device_id
       FROM employees
       WHERE business_id = ? AND deleted_at IS NULL
       ORDER BY name COLLATE NOCASE`,
      [businessId],
    );

    return rows.map((row) => mapEmployee(employeeRowSchema.parse(row)));
  }

  async create(employee: Employee): Promise<void> {
    await this.database.execute(
      `INSERT INTO employees (
         id, business_id, name, phone, email, color, user_id, account_role,
         created_at, updated_at, deleted_at, version, device_id
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employee.id,
        employee.businessId,
        employee.name,
        employee.phone,
        employee.email,
        employee.color,
        employee.userId,
        employee.accountRole,
        employee.createdAt,
        employee.updatedAt,
        employee.deletedAt,
        employee.version,
        employee.deviceId,
      ],
    );
  }

  async update(employee: Employee): Promise<void> {
    await this.database.execute(
      `UPDATE employees SET name = ?, phone = ?, email = ?, color = ?,
         user_id = ?, account_role = ?, updated_at = ?, version = ?,
         device_id = ? WHERE id = ?`,
      [
        employee.name,
        employee.phone,
        employee.email,
        employee.color,
        employee.userId,
        employee.accountRole,
        employee.updatedAt,
        employee.version,
        employee.deviceId,
        employee.id,
      ],
    );
  }
}
