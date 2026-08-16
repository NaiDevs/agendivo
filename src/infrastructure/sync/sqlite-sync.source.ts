import { z } from "zod";

import { APPOINTMENT_STATUS } from "@/domain/entities/appointment";
import type { SyncSnapshot } from "@/domain/entities/sync-snapshot";
import type { LocalSyncSource } from "@/domain/repositories/cloud-sync.repository";
import type { DatabaseClient } from "@/infrastructure/database/database-client";

const syncFields = {
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
  version: z.number().int().positive(),
  device_id: z.string().uuid(),
};

const businessSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  timezone: z.string(),
  currency: z.string().length(3),
  ...syncFields,
});

const customerSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  name: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  notes: z.string().nullable(),
  ...syncFields,
});

const employeeSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  name: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  color: z.string(),
  ...syncFields,
});

const serviceSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  duration_minutes: z.number().int().positive(),
  price: z.number().int().nonnegative(),
  ...syncFields,
});

const appointmentSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  employee_id: z.string().uuid().nullable(),
  service_id: z.string().uuid().nullable(),
  starts_at: z.string(),
  ends_at: z.string(),
  status: z.enum([
    APPOINTMENT_STATUS.PENDING,
    APPOINTMENT_STATUS.CONFIRMED,
    APPOINTMENT_STATUS.COMPLETED,
    APPOINTMENT_STATUS.CANCELLED,
    APPOINTMENT_STATUS.NO_SHOW,
  ]),
  price: z.number().int().nonnegative(),
  notes: z.string().nullable(),
  ...syncFields,
});

const fiscalProfileSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  country_code: z.string().length(2),
  legal_name: z.string(),
  tax_id: z.string().nullable(),
  invoices_enabled: z.number().int().min(0).max(1),
  ...syncFields,
});

const emissionPointSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  name: z.string(),
  establishment_code: z.string().length(3),
  emission_point_code: z.string().length(3),
  ...syncFields,
});

const fiscalAuthorizationSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  emission_point_id: z.string().uuid(),
  cai: z.string(),
  document_type: z.literal("invoice"),
  range_start: z.number().int().nonnegative(),
  range_end: z.number().int().nonnegative(),
  next_number: z.number().int().nonnegative(),
  valid_until: z.string(),
  active: z.number().int().min(0).max(1),
  ...syncFields,
});

export class SqliteSyncSource implements LocalSyncSource {
  constructor(private readonly database: DatabaseClient) {}

  async readSnapshot(businessId: string): Promise<SyncSnapshot> {
    const [
      businessRows,
      customers,
      employees,
      services,
      appointments,
      fiscalProfiles,
      emissionPoints,
      fiscalAuthorizations,
    ] = await Promise.all([
      this.database.select<unknown[]>(
        `SELECT id, name, phone, email, address, timezone, currency,
                  created_at, updated_at, deleted_at, version, device_id
           FROM businesses WHERE id = ? LIMIT 1`,
        [businessId],
      ),
      this.database.select<unknown[]>(
        `SELECT id, business_id, name, phone, email, notes,
                  created_at, updated_at, deleted_at, version, device_id
           FROM customers WHERE business_id = ?`,
        [businessId],
      ),
      this.database.select<unknown[]>(
        `SELECT id, business_id, name, phone, email, color,
                  created_at, updated_at, deleted_at, version, device_id
           FROM employees WHERE business_id = ?`,
        [businessId],
      ),
      this.database.select<unknown[]>(
        `SELECT id, business_id, name, description, duration_minutes, price,
                  created_at, updated_at, deleted_at, version, device_id
           FROM services WHERE business_id = ?`,
        [businessId],
      ),
      this.database.select<unknown[]>(
        `SELECT id, business_id, customer_id, employee_id, service_id,
                  starts_at, ends_at, status, price, notes,
                  created_at, updated_at, deleted_at, version, device_id
           FROM appointments WHERE business_id = ?`,
        [businessId],
      ),
      this.database.select<unknown[]>(
        `SELECT id, business_id, country_code, legal_name, tax_id,
                  invoices_enabled, created_at, updated_at, deleted_at,
                  version, device_id
           FROM fiscal_profiles WHERE business_id = ?`,
        [businessId],
      ),
      this.database.select<unknown[]>(
        `SELECT id, business_id, name, establishment_code,
                  emission_point_code, created_at, updated_at, deleted_at,
                  version, device_id
           FROM emission_points WHERE business_id = ?`,
        [businessId],
      ),
      this.database.select<unknown[]>(
        `SELECT id, business_id, emission_point_id, cai, document_type,
                  range_start, range_end, next_number, valid_until, active,
                  created_at, updated_at, deleted_at, version, device_id
           FROM fiscal_authorizations WHERE business_id = ?`,
        [businessId],
      ),
    ]);

    const business = businessRows[0];
    if (business === undefined) {
      throw new Error("No se encontró el negocio local para sincronizar.");
    }

    return {
      business: businessSchema.parse(business),
      customers: z.array(customerSchema).parse(customers),
      emissionPoints: z.array(emissionPointSchema).parse(emissionPoints),
      employees: z.array(employeeSchema).parse(employees),
      fiscalAuthorizations: z
        .array(fiscalAuthorizationSchema)
        .parse(fiscalAuthorizations),
      fiscalProfiles: z.array(fiscalProfileSchema).parse(fiscalProfiles),
      services: z.array(serviceSchema).parse(services),
      appointments: z.array(appointmentSchema).parse(appointments),
    };
  }
}
