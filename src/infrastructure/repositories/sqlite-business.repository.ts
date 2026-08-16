import { z } from "zod";

import type { Business } from "@/domain/entities/business";
import type {
  EmissionPoint,
  FiscalAuthorization,
  FiscalConfiguration,
  FiscalProfile,
} from "@/domain/entities/fiscal-configuration";
import type {
  BusinessOnboardingRecords,
  BusinessRepository,
} from "@/domain/repositories/business.repository";
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

const fiscalProfileRowSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  country_code: z.string(),
  legal_name: z.string(),
  tax_id: z.string().nullable(),
  invoices_enabled: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
  version: z.number().int().positive(),
  device_id: z.string().uuid(),
});
const emissionPointRowSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  name: z.string(),
  establishment_code: z.string(),
  emission_point_code: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
  version: z.number().int().positive(),
  device_id: z.string().uuid(),
});
const authorizationRowSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  emission_point_id: z.string().uuid(),
  cai: z.string(),
  document_type: z.literal("invoice"),
  range_start: z.number(),
  range_end: z.number(),
  next_number: z.number(),
  valid_until: z.string(),
  active: z.number(),
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

  async update(business: Business): Promise<void> {
    await this.database.execute(
      `UPDATE businesses SET name = ?, phone = ?, email = ?, address = ?,
       timezone = ?, currency = ?, updated_at = ?, version = ?, device_id = ?
       WHERE id = ?`,
      [
        business.name,
        business.phone,
        business.email,
        business.address,
        business.timezone,
        business.currency,
        business.updatedAt,
        business.version,
        business.deviceId,
        business.id,
      ],
    );
  }

  async findFiscalConfiguration(
    businessId: string,
  ): Promise<FiscalConfiguration | null> {
    const [profileRows, pointRows, authorizationRows] = await Promise.all([
      this.database.select<unknown[]>(
        `SELECT * FROM fiscal_profiles WHERE business_id = ? AND deleted_at IS NULL LIMIT 1`,
        [businessId],
      ),
      this.database.select<unknown[]>(
        `SELECT * FROM emission_points WHERE business_id = ? AND deleted_at IS NULL LIMIT 1`,
        [businessId],
      ),
      this.database.select<unknown[]>(
        `SELECT * FROM fiscal_authorizations WHERE business_id = ? AND deleted_at IS NULL AND active = 1 LIMIT 1`,
        [businessId],
      ),
    ]);
    if (profileRows[0] === undefined) return null;
    const profileRow = fiscalProfileRowSchema.parse(profileRows[0]);
    const pointRow =
      pointRows[0] === undefined
        ? null
        : emissionPointRowSchema.parse(pointRows[0]);
    const authorizationRow =
      authorizationRows[0] === undefined
        ? null
        : authorizationRowSchema.parse(authorizationRows[0]);
    const profile: FiscalProfile = {
      id: profileRow.id,
      businessId: profileRow.business_id,
      countryCode: profileRow.country_code,
      legalName: profileRow.legal_name,
      taxId: profileRow.tax_id,
      invoicesEnabled: profileRow.invoices_enabled === 1,
      createdAt: profileRow.created_at,
      updatedAt: profileRow.updated_at,
      deletedAt: profileRow.deleted_at,
      version: profileRow.version,
      deviceId: profileRow.device_id,
    };
    const emissionPoint: EmissionPoint | null =
      pointRow === null
        ? null
        : {
            id: pointRow.id,
            businessId: pointRow.business_id,
            name: pointRow.name,
            establishmentCode: pointRow.establishment_code,
            emissionPointCode: pointRow.emission_point_code,
            createdAt: pointRow.created_at,
            updatedAt: pointRow.updated_at,
            deletedAt: pointRow.deleted_at,
            version: pointRow.version,
            deviceId: pointRow.device_id,
          };
    const authorization: FiscalAuthorization | null =
      authorizationRow === null
        ? null
        : {
            id: authorizationRow.id,
            businessId: authorizationRow.business_id,
            emissionPointId: authorizationRow.emission_point_id,
            cai: authorizationRow.cai,
            documentType: authorizationRow.document_type,
            rangeStart: authorizationRow.range_start,
            rangeEnd: authorizationRow.range_end,
            nextNumber: authorizationRow.next_number,
            validUntil: authorizationRow.valid_until,
            active: authorizationRow.active === 1,
            createdAt: authorizationRow.created_at,
            updatedAt: authorizationRow.updated_at,
            deletedAt: authorizationRow.deleted_at,
            version: authorizationRow.version,
            deviceId: authorizationRow.device_id,
          };
    return { profile, emissionPoint, authorization };
  }

  async saveFiscalConfiguration(
    configuration: FiscalConfiguration,
  ): Promise<void> {
    const { profile, emissionPoint, authorization } = configuration;
    await this.database.execute(
      `INSERT INTO fiscal_profiles (id, business_id, country_code, legal_name,
         tax_id, invoices_enabled, created_at, updated_at, deleted_at, version, device_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET country_code = excluded.country_code,
         legal_name = excluded.legal_name, tax_id = excluded.tax_id,
         invoices_enabled = excluded.invoices_enabled, updated_at = excluded.updated_at,
         version = excluded.version, device_id = excluded.device_id`,
      [
        profile.id,
        profile.businessId,
        profile.countryCode,
        profile.legalName,
        profile.taxId,
        profile.invoicesEnabled ? 1 : 0,
        profile.createdAt,
        profile.updatedAt,
        profile.deletedAt,
        profile.version,
        profile.deviceId,
      ],
    );
    if (emissionPoint !== null && authorization !== null) {
      await this.database.execute(
        `INSERT INTO emission_points (id, business_id, name, establishment_code,
           emission_point_code, created_at, updated_at, deleted_at, version, device_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET name = excluded.name,
           establishment_code = excluded.establishment_code,
           emission_point_code = excluded.emission_point_code,
           updated_at = excluded.updated_at, version = excluded.version,
           device_id = excluded.device_id`,
        [
          emissionPoint.id,
          emissionPoint.businessId,
          emissionPoint.name,
          emissionPoint.establishmentCode,
          emissionPoint.emissionPointCode,
          emissionPoint.createdAt,
          emissionPoint.updatedAt,
          emissionPoint.deletedAt,
          emissionPoint.version,
          emissionPoint.deviceId,
        ],
      );
      await this.database.execute(
        `INSERT INTO fiscal_authorizations (id, business_id, emission_point_id,
           cai, document_type, range_start, range_end, next_number, valid_until,
           active, created_at, updated_at, deleted_at, version, device_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET cai = excluded.cai,
           range_start = excluded.range_start, range_end = excluded.range_end,
           next_number = excluded.next_number, valid_until = excluded.valid_until,
           updated_at = excluded.updated_at, version = excluded.version,
           device_id = excluded.device_id`,
        [
          authorization.id,
          authorization.businessId,
          authorization.emissionPointId,
          authorization.cai,
          authorization.documentType,
          authorization.rangeStart,
          authorization.rangeEnd,
          authorization.nextNumber,
          authorization.validUntil,
          authorization.active ? 1 : 0,
          authorization.createdAt,
          authorization.updatedAt,
          authorization.deletedAt,
          authorization.version,
          authorization.deviceId,
        ],
      );
    }
  }

  async createOnboarding(records: BusinessOnboardingRecords): Promise<void> {
    await this.create(records.business);
    const profile = records.fiscalProfile;
    await this.database.execute(
      `INSERT INTO fiscal_profiles (
           id, business_id, country_code, legal_name, tax_id, invoices_enabled,
           created_at, updated_at, deleted_at, version, device_id
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        profile.id,
        profile.businessId,
        profile.countryCode,
        profile.legalName,
        profile.taxId,
        profile.invoicesEnabled ? 1 : 0,
        profile.createdAt,
        profile.updatedAt,
        profile.deletedAt,
        profile.version,
        profile.deviceId,
      ],
    );

    const point = records.emissionPoint;
    const authorization = records.fiscalAuthorization;
    if (point !== null && authorization !== null) {
      await this.database.execute(
        `INSERT INTO emission_points (
             id, business_id, name, establishment_code, emission_point_code,
             created_at, updated_at, deleted_at, version, device_id
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          point.id,
          point.businessId,
          point.name,
          point.establishmentCode,
          point.emissionPointCode,
          point.createdAt,
          point.updatedAt,
          point.deletedAt,
          point.version,
          point.deviceId,
        ],
      );
      await this.database.execute(
        `INSERT INTO fiscal_authorizations (
             id, business_id, emission_point_id, cai, document_type,
             range_start, range_end, next_number, valid_until, active,
             created_at, updated_at, deleted_at, version, device_id
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          authorization.id,
          authorization.businessId,
          authorization.emissionPointId,
          authorization.cai,
          authorization.documentType,
          authorization.rangeStart,
          authorization.rangeEnd,
          authorization.nextNumber,
          authorization.validUntil,
          authorization.active ? 1 : 0,
          authorization.createdAt,
          authorization.updatedAt,
          authorization.deletedAt,
          authorization.version,
          authorization.deviceId,
        ],
      );
    }
  }
}
