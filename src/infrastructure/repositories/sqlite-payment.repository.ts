import { z } from "zod";

import { PAYMENT_METHOD, type Payment } from "@/domain/entities/payment";
import type { PaymentRepository } from "@/domain/repositories/payment.repository";
import type { DatabaseClient } from "@/infrastructure/database/database-client";

const paymentRowSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  appointment_id: z.string().uuid().nullable(),
  customer_id: z.string().uuid(),
  amount: z.number().int().positive(),
  method: z.enum([
    PAYMENT_METHOD.CASH,
    PAYMENT_METHOD.CARD,
    PAYMENT_METHOD.TRANSFER,
    PAYMENT_METHOD.OTHER,
  ]),
  paid_at: z.string(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
  version: z.number().int().positive(),
  device_id: z.string().uuid(),
});

type PaymentRow = z.infer<typeof paymentRowSchema>;

function mapPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    businessId: row.business_id,
    appointmentId: row.appointment_id,
    customerId: row.customer_id,
    amount: row.amount,
    method: row.method,
    paidAt: row.paid_at,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    version: row.version,
    deviceId: row.device_id,
  };
}

const SELECT_COLUMNS = `id, business_id, appointment_id, customer_id, amount,
        method, paid_at, notes,
        created_at, updated_at, deleted_at, version, device_id`;

export class SqlitePaymentRepository implements PaymentRepository {
  constructor(private readonly database: DatabaseClient) {}

  async findActiveByBusiness(businessId: string): Promise<Payment[]> {
    const rows = await this.database.select<unknown[]>(
      `SELECT ${SELECT_COLUMNS}
       FROM payments
       WHERE business_id = ? AND deleted_at IS NULL
       ORDER BY paid_at DESC`,
      [businessId],
    );
    return rows.map((row) => mapPayment(paymentRowSchema.parse(row)));
  }

  async findByAppointment(appointmentId: string): Promise<Payment[]> {
    const rows = await this.database.select<unknown[]>(
      `SELECT ${SELECT_COLUMNS}
       FROM payments
       WHERE appointment_id = ? AND deleted_at IS NULL
       ORDER BY paid_at DESC`,
      [appointmentId],
    );
    return rows.map((row) => mapPayment(paymentRowSchema.parse(row)));
  }

  async create(payment: Payment): Promise<void> {
    await this.database.execute(
      `INSERT INTO payments (
         id, business_id, appointment_id, customer_id, amount,
         method, paid_at, notes,
         created_at, updated_at, deleted_at, version, device_id
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      paymentValues(payment),
    );
  }

  async void(payment: Payment): Promise<void> {
    await this.database.execute(
      `UPDATE payments SET
         business_id = ?, appointment_id = ?, customer_id = ?, amount = ?,
         method = ?, paid_at = ?, notes = ?,
         created_at = ?, updated_at = ?, deleted_at = ?, version = ?, device_id = ?
       WHERE id = ?`,
      [...paymentValues(payment).slice(1), payment.id],
    );
  }
}

function paymentValues(payment: Payment): unknown[] {
  return [
    payment.id,
    payment.businessId,
    payment.appointmentId,
    payment.customerId,
    payment.amount,
    payment.method,
    payment.paidAt,
    payment.notes,
    payment.createdAt,
    payment.updatedAt,
    payment.deletedAt,
    payment.version,
    payment.deviceId,
  ];
}
