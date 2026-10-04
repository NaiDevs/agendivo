import { z } from "zod";

import {
  PAYMENT_DOCUMENT_TYPE,
  PAYMENT_METHOD,
  type Payment,
} from "@/domain/entities/payment";
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
  document_type: z.enum([
    PAYMENT_DOCUMENT_TYPE.RECEIPT,
    PAYMENT_DOCUMENT_TYPE.FISCAL_INVOICE,
  ]),
  fiscal_data: z.string().nullable(),
  service_items: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
  version: z.number().int().positive(),
  device_id: z.string().uuid(),
});

type PaymentRow = z.infer<typeof paymentRowSchema>;

const fiscalInvoiceSchema = z.object({
  authorizationId: z.string().uuid(),
  cai: z.string(),
  correlative: z.number().int().nonnegative(),
  emissionPointCode: z.string().length(3),
  establishmentCode: z.string().length(3),
  issuedDate: z.iso.date(),
  legalName: z.string(),
  number: z.string(),
  rangeEnd: z.number().int().nonnegative(),
  rangeStart: z.number().int().nonnegative(),
  taxId: z.string(),
  validUntil: z.string(),
});

const serviceItemsSchema = z.array(
  z.object({
    serviceId: z.string().uuid(),
    name: z.string(),
    durationMinutes: z.number().int().positive(),
    price: z.number().int().nonnegative(),
  }),
);

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
    documentType: row.document_type,
    fiscalInvoice:
      row.fiscal_data === null
        ? null
        : fiscalInvoiceSchema.parse(JSON.parse(row.fiscal_data) as unknown),
    serviceItems: serviceItemsSchema.parse(
      JSON.parse(row.service_items) as unknown,
    ),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    version: row.version,
    deviceId: row.device_id,
  };
}

const SELECT_COLUMNS = `id, business_id, appointment_id, customer_id, amount,
        method, paid_at, notes, document_type, fiscal_data, service_items,
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
         method, paid_at, notes, document_type, fiscal_data, service_items,
         created_at, updated_at, deleted_at, version, device_id
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      paymentValues(payment),
    );
  }

  async issueFiscalInvoice(payment: Payment): Promise<void> {
    await this.database.execute(
      `UPDATE payments SET
         document_type = ?, fiscal_data = ?, updated_at = ?, version = ?, device_id = ?
       WHERE id = ? AND business_id = ? AND deleted_at IS NULL
         AND document_type = 'receipt'`,
      [
        payment.documentType,
        JSON.stringify(payment.fiscalInvoice),
        payment.updatedAt,
        payment.version,
        payment.deviceId,
        payment.id,
        payment.businessId,
      ],
    );
  }

  async void(payment: Payment): Promise<void> {
    await this.database.execute(
      `UPDATE payments SET
         business_id = ?, appointment_id = ?, customer_id = ?, amount = ?,
         method = ?, paid_at = ?, notes = ?, document_type = ?, fiscal_data = ?, service_items = ?,
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
    payment.documentType,
    payment.fiscalInvoice === null
      ? null
      : JSON.stringify(payment.fiscalInvoice),
    JSON.stringify(payment.serviceItems),
    payment.createdAt,
    payment.updatedAt,
    payment.deletedAt,
    payment.version,
    payment.deviceId,
  ];
}
