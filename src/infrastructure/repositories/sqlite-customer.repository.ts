import { z } from "zod";

import type { Customer } from "@/domain/entities/customer";
import type { CustomerRepository } from "@/domain/repositories/customer.repository";
import type { DatabaseClient } from "@/infrastructure/database/database-client";
import { customerCustomFieldValueSchema } from "@/schemas/customer.schema";

const customFieldValuesSchema = z.record(
  z.string().uuid(),
  customerCustomFieldValueSchema,
);

function parseCustomFieldValues(value: string): Customer["customFieldValues"] {
  return customFieldValuesSchema.parse(JSON.parse(value) as unknown);
}

const customerRowSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  name: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  notes: z.string().nullable(),
  custom_field_values: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
  version: z.number().int().positive(),
  device_id: z.string().uuid(),
});

type CustomerRow = z.infer<typeof customerRowSchema>;

function mapCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    notes: row.notes,
    customFieldValues: parseCustomFieldValues(row.custom_field_values),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    version: row.version,
    deviceId: row.device_id,
  };
}

export class SqliteCustomerRepository implements CustomerRepository {
  constructor(private readonly database: DatabaseClient) {}

  async findActiveByBusiness(businessId: string): Promise<Customer[]> {
    const rows = await this.database.select<unknown[]>(
      `SELECT id, business_id, name, phone, email, notes, custom_field_values,
              created_at, updated_at, deleted_at, version, device_id
       FROM customers
       WHERE business_id = ? AND deleted_at IS NULL
       ORDER BY name COLLATE NOCASE`,
      [businessId],
    );

    return rows.map((row) => mapCustomer(customerRowSchema.parse(row)));
  }

  async create(customer: Customer): Promise<void> {
    await this.database.execute(
      `INSERT INTO customers (
         id, business_id, name, phone, email, notes, custom_field_values,
         created_at, updated_at, deleted_at, version, device_id
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customer.id,
        customer.businessId,
        customer.name,
        customer.phone,
        customer.email,
        customer.notes,
        JSON.stringify(customer.customFieldValues),
        customer.createdAt,
        customer.updatedAt,
        customer.deletedAt,
        customer.version,
        customer.deviceId,
      ],
    );
  }

  async update(customer: Customer): Promise<void> {
    await this.database.execute(
      `UPDATE customers SET name = ?, phone = ?, email = ?, notes = ?,
         custom_field_values = ?, updated_at = ?, version = ?, device_id = ?
       WHERE id = ? AND business_id = ?`,
      [
        customer.name,
        customer.phone,
        customer.email,
        customer.notes,
        JSON.stringify(customer.customFieldValues),
        customer.updatedAt,
        customer.version,
        customer.deviceId,
        customer.id,
        customer.businessId,
      ],
    );
  }
}
