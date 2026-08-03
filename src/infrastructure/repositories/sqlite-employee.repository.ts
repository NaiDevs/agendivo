import { z } from "zod";

import type { Employee } from "@/domain/entities/employee";
import type { EmployeeRepository } from "@/domain/repositories/employee.repository";
import type { DatabaseClient } from "@/infrastructure/database/database-client";

const employeeRowSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  name: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  color: z.string(),
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
      `SELECT id, business_id, name, phone, email, color,
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
         id, business_id, name, phone, email, color,
         created_at, updated_at, deleted_at, version, device_id
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employee.id,
        employee.businessId,
        employee.name,
        employee.phone,
        employee.email,
        employee.color,
        employee.createdAt,
        employee.updatedAt,
        employee.deletedAt,
        employee.version,
        employee.deviceId,
      ],
    );
  }
}
