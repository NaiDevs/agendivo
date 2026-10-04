import { z } from "zod";

import {
  CUSTOMER_CUSTOM_FIELD_TYPE,
  type CustomerCustomField,
} from "@/domain/entities/customer-custom-field";
import type { CustomerCustomFieldRepository } from "@/domain/repositories/customer-custom-field.repository";
import type { DatabaseClient } from "@/infrastructure/database/database-client";

const sqliteBooleanSchema = z.union([z.literal(0), z.literal(1)]);
const customerCustomFieldRowSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  name: z.string(),
  type: z.enum([
    CUSTOMER_CUSTOM_FIELD_TYPE.TEXT,
    CUSTOMER_CUSTOM_FIELD_TYPE.TELEPHONE,
    CUSTOMER_CUSTOM_FIELD_TYPE.NUMBER,
    CUSTOMER_CUSTOM_FIELD_TYPE.BOOLEAN,
    CUSTOMER_CUSTOM_FIELD_TYPE.DATETIME,
    CUSTOMER_CUSTOM_FIELD_TYPE.EMAIL,
    CUSTOMER_CUSTOM_FIELD_TYPE.SELECT,
  ]),
  is_required: sqliteBooleanSchema,
  is_multiple: sqliteBooleanSchema,
  options: z.string(),
  sort_order: z.number().int().nonnegative(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
  version: z.number().int().positive(),
  device_id: z.string().uuid(),
});

function mapCustomerCustomField(
  row: z.infer<typeof customerCustomFieldRowSchema>,
): CustomerCustomField {
  return {
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    type: row.type,
    isRequired: row.is_required === 1,
    isMultiple: row.is_multiple === 1,
    options: z.array(z.string()).parse(JSON.parse(row.options) as unknown),
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    version: row.version,
    deviceId: row.device_id,
  };
}

export class SqliteCustomerCustomFieldRepository implements CustomerCustomFieldRepository {
  constructor(private readonly database: DatabaseClient) {}

  async findActiveByBusiness(
    businessId: string,
  ): Promise<CustomerCustomField[]> {
    const rows = await this.database.select<unknown[]>(
      `SELECT id, business_id, name, type, is_required, is_multiple, options,
              sort_order, created_at, updated_at, deleted_at, version, device_id
       FROM customer_custom_fields
       WHERE business_id = ? AND deleted_at IS NULL
       ORDER BY sort_order, name COLLATE NOCASE`,
      [businessId],
    );
    return rows.map((row) =>
      mapCustomerCustomField(customerCustomFieldRowSchema.parse(row)),
    );
  }

  async create(field: CustomerCustomField): Promise<void> {
    await this.database.execute(
      `INSERT INTO customer_custom_fields (
         id, business_id, name, type, is_required, is_multiple, options,
         sort_order, created_at, updated_at, deleted_at, version, device_id
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      this.bindValues(field),
    );
  }

  async update(field: CustomerCustomField): Promise<void> {
    await this.database.execute(
      `UPDATE customer_custom_fields SET
         name = ?, type = ?, is_required = ?, is_multiple = ?, options = ?,
         sort_order = ?, updated_at = ?, deleted_at = ?, version = ?, device_id = ?
       WHERE id = ? AND business_id = ?`,
      [
        field.name,
        field.type,
        Number(field.isRequired),
        Number(field.isMultiple),
        JSON.stringify(field.options),
        field.sortOrder,
        field.updatedAt,
        field.deletedAt,
        field.version,
        field.deviceId,
        field.id,
        field.businessId,
      ],
    );
  }

  private bindValues(field: CustomerCustomField): unknown[] {
    return [
      field.id,
      field.businessId,
      field.name,
      field.type,
      Number(field.isRequired),
      Number(field.isMultiple),
      JSON.stringify(field.options),
      field.sortOrder,
      field.createdAt,
      field.updatedAt,
      field.deletedAt,
      field.version,
      field.deviceId,
    ];
  }
}
