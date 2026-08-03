import { z } from "zod";

import type { Business } from "@/domain/entities/business";
import type { BusinessRepository } from "@/domain/repositories/business.repository";
import type { DatabaseClient } from "@/infrastructure/database/database-client";

const businessRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  timezone: z.string(),
  currency: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
  version: z.number().int().positive(),
  device_id: z.string().uuid(),
});

type BusinessRow = z.infer<typeof businessRowSchema>;

function mapBusiness(row: BusinessRow): Business {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    timezone: row.timezone,
    currency: row.currency,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    version: row.version,
    deviceId: row.device_id,
  };
}

export class SqliteBusinessRepository implements BusinessRepository {
  constructor(private readonly database: DatabaseClient) {}

  async findActive(): Promise<Business | null> {
    const rows = await this.database.select<unknown[]>(
      `SELECT id, name, phone, email, address, timezone, currency,
              created_at, updated_at, deleted_at, version, device_id
       FROM businesses
       WHERE deleted_at IS NULL
       ORDER BY created_at
       LIMIT 1`,
    );
    const row = rows[0];

    return row === undefined ? null : mapBusiness(businessRowSchema.parse(row));
  }

  async create(business: Business): Promise<void> {
    await this.database.execute(
      `INSERT INTO businesses (
         id, name, phone, email, address, timezone, currency,
         created_at, updated_at, deleted_at, version, device_id
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        business.id,
        business.name,
        business.phone,
        business.email,
        business.address,
        business.timezone,
        business.currency,
        business.createdAt,
        business.updatedAt,
        business.deletedAt,
        business.version,
        business.deviceId,
      ],
    );
  }
}
