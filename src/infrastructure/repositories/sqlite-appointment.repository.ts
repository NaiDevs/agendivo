import { z } from "zod";

import {
  APPOINTMENT_STATUS,
  type Appointment,
} from "@/domain/entities/appointment";
import type { AppointmentRepository } from "@/domain/repositories/appointment.repository";
import type { DatabaseClient } from "@/infrastructure/database/database-client";

const appointmentRowSchema = z.object({
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
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
  version: z.number().int().positive(),
  device_id: z.string().uuid(),
});

type AppointmentRow = z.infer<typeof appointmentRowSchema>;

function mapAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    businessId: row.business_id,
    customerId: row.customer_id,
    employeeId: row.employee_id,
    serviceId: row.service_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    price: row.price,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    version: row.version,
    deviceId: row.device_id,
  };
}

export class SqliteAppointmentRepository implements AppointmentRepository {
  constructor(private readonly database: DatabaseClient) {}

  async findActiveByBusiness(businessId: string): Promise<Appointment[]> {
    const rows = await this.database.select<unknown[]>(
      `SELECT id, business_id, customer_id, employee_id, service_id,
              starts_at, ends_at, status, price, notes,
              created_at, updated_at, deleted_at, version, device_id
       FROM appointments
       WHERE business_id = ? AND deleted_at IS NULL
       ORDER BY starts_at`,
      [businessId],
    );
    return rows.map((row) => mapAppointment(appointmentRowSchema.parse(row)));
  }

  async hasOverlap(
    employeeId: string,
    startsAt: string,
    endsAt: string,
    excludedAppointmentId?: string,
  ): Promise<boolean> {
    const rows = await this.database.select<unknown[]>(
      `SELECT id
       FROM appointments
       WHERE employee_id = ?
         AND deleted_at IS NULL
         AND status NOT IN ('cancelled', 'no_show')
         AND starts_at < ?
         AND ends_at > ?
         AND (? IS NULL OR id <> ?)
       LIMIT 1`,
      [
        employeeId,
        endsAt,
        startsAt,
        excludedAppointmentId ?? null,
        excludedAppointmentId ?? null,
      ],
    );
    return z.array(z.object({ id: z.string().uuid() })).parse(rows).length > 0;
  }

  async create(appointment: Appointment): Promise<void> {
    await this.database.execute(
      `INSERT INTO appointments (
         id, business_id, customer_id, employee_id, service_id,
         starts_at, ends_at, status, price, notes,
         created_at, updated_at, deleted_at, version, device_id
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      appointmentValues(appointment),
    );
  }

  async update(appointment: Appointment): Promise<void> {
    await this.database.execute(
      `UPDATE appointments SET
         business_id = ?, customer_id = ?, employee_id = ?, service_id = ?,
         starts_at = ?, ends_at = ?, status = ?, price = ?, notes = ?,
         created_at = ?, updated_at = ?, deleted_at = ?, version = ?, device_id = ?
       WHERE id = ?`,
      [...appointmentValues(appointment).slice(1), appointment.id],
    );
  }
}

function appointmentValues(appointment: Appointment): unknown[] {
  return [
    appointment.id,
    appointment.businessId,
    appointment.customerId,
    appointment.employeeId,
    appointment.serviceId,
    appointment.startsAt,
    appointment.endsAt,
    appointment.status,
    appointment.price,
    appointment.notes,
    appointment.createdAt,
    appointment.updatedAt,
    appointment.deletedAt,
    appointment.version,
    appointment.deviceId,
  ];
}
