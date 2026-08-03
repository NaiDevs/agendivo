import { z } from "zod";

import type { Service } from "@/domain/entities/service";
import type { ServiceRepository } from "@/domain/repositories/service.repository";
import type { DatabaseClient } from "@/infrastructure/database/database-client";

const serviceRowSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  duration_minutes: z.number().int().positive(),
  price: z.number().int().nonnegative(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
  version: z.number().int().positive(),
  device_id: z.string().uuid(),
});

type ServiceRow = z.infer<typeof serviceRowSchema>;

function mapService(row: ServiceRow): Service {
  return {
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    description: row.description,
    durationMinutes: row.duration_minutes,
    price: row.price,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    version: row.version,
    deviceId: row.device_id,
  };
}

export class SqliteServiceRepository implements ServiceRepository {
  constructor(private readonly database: DatabaseClient) {}

  async findActiveByBusiness(businessId: string): Promise<Service[]> {
    const rows = await this.database.select<unknown[]>(
      `SELECT id, business_id, name, description, duration_minutes, price,
              created_at, updated_at, deleted_at, version, device_id
       FROM services
       WHERE business_id = ? AND deleted_at IS NULL
       ORDER BY name COLLATE NOCASE`,
      [businessId],
    );

    return rows.map((row) => mapService(serviceRowSchema.parse(row)));
  }

  async create(service: Service): Promise<void> {
    await this.database.execute(
      `INSERT INTO services (
         id, business_id, name, description, duration_minutes, price,
         created_at, updated_at, deleted_at, version, device_id
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        service.id,
        service.businessId,
        service.name,
        service.description,
        service.durationMinutes,
        service.price,
        service.createdAt,
        service.updatedAt,
        service.deletedAt,
        service.version,
        service.deviceId,
      ],
    );
  }
}
