import type { Payment } from "@/domain/entities/payment";
import { PaymentExceedsBalanceError } from "@/domain/errors/payment-exceeds-balance.error";
import type { PaymentRepository } from "@/domain/repositories/payment.repository";
import {
  paymentFormSchema,
  type PaymentFormValues,
} from "@/schemas/payment.schema";

export function pendingBalance(
  appointmentPriceInCents: number,
  activePayments: Payment[],
): number {
  const paid = activePayments.reduce((sum, payment) => sum + payment.amount, 0);
  return appointmentPriceInCents - paid;
}

export async function createPayment(
  values: PaymentFormValues,
  businessId: string,
  deviceId: string,
  repository: PaymentRepository,
  remainingBalanceInCents?: number | null,
): Promise<Payment> {
  const input = paymentFormSchema.parse(values);
  const amount = Math.round(input.amount * 100);
  const appointmentId = input.appointmentId === "" ? null : input.appointmentId;

  if (
    appointmentId !== null &&
    typeof remainingBalanceInCents === "number" &&
    amount > remainingBalanceInCents
  ) {
    throw new PaymentExceedsBalanceError();
  }

  const now = new Date().toISOString();
  const payment: Payment = {
    id: crypto.randomUUID(),
    businessId,
    appointmentId,
    customerId: input.customerId,
    amount,
    method: input.method,
    paidAt: new Date(input.paidAt).toISOString(),
    notes: input.notes === "" ? null : input.notes,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    version: 1,
    deviceId,
  };

  await repository.create(payment);
  return payment;
}

export async function voidPayment(
  current: Payment,
  repository: PaymentRepository,
): Promise<Payment> {
  const now = new Date().toISOString();
  const payment: Payment = {
    ...current,
    deletedAt: now,
    updatedAt: now,
    version: current.version + 1,
  };
  await repository.void(payment);
  return payment;
}
