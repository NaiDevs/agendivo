import { describe, expect, it } from "vitest";

import { PAYMENT_METHOD, type Payment } from "@/domain/entities/payment";
import { PaymentExceedsBalanceError } from "@/domain/errors/payment-exceeds-balance.error";
import type { PaymentRepository } from "@/domain/repositories/payment.repository";
import {
  createPayment,
  pendingBalance,
  voidPayment,
} from "@/domain/services/payment.service";

class FakePaymentRepository implements PaymentRepository {
  created: Payment | null = null;
  voided: Payment | null = null;

  async findActiveByBusiness(): Promise<Payment[]> {
    return [];
  }
  async findByAppointment(): Promise<Payment[]> {
    return [];
  }
  async create(payment: Payment): Promise<void> {
    this.created = payment;
  }
  async void(payment: Payment): Promise<void> {
    this.voided = payment;
  }
}

const businessId = "44444444-4444-4444-8444-444444444444";
const deviceId = "55555555-5555-4555-8555-555555555555";
const appointmentId = "22222222-2222-4222-8222-222222222222";

const values = {
  customerId: "11111111-1111-4111-8111-111111111111",
  appointmentId: "",
  amount: 150.5,
  method: PAYMENT_METHOD.CASH,
  paidAt: "2026-08-04T10:30",
  notes: "",
};

function makePayment(amount: number): Payment {
  return {
    id: crypto.randomUUID(),
    businessId,
    appointmentId,
    customerId: values.customerId,
    amount,
    method: PAYMENT_METHOD.CASH,
    paidAt: "2026-08-04T10:30:00.000Z",
    notes: null,
    createdAt: "2026-08-04T10:30:00.000Z",
    updatedAt: "2026-08-04T10:30:00.000Z",
    deletedAt: null,
    version: 1,
    deviceId,
  };
}

describe("pendingBalance", () => {
  it("resta los pagos activos al precio de la cita", () => {
    expect(pendingBalance(10000, [makePayment(3000), makePayment(2000)])).toBe(
      5000,
    );
  });
});

describe("createPayment", () => {
  it("convierte el monto a centavos y guarda una fecha UTC", async () => {
    const repository = new FakePaymentRepository();
    const payment = await createPayment(
      values,
      businessId,
      deviceId,
      repository,
    );

    expect(payment.amount).toBe(15050);
    expect(payment.paidAt.endsWith("Z")).toBe(true);
    expect(payment.appointmentId).toBeNull();
    expect(repository.created).toEqual(payment);
  });

  it("permite un walk-in sin cita ni tope de saldo", async () => {
    const repository = new FakePaymentRepository();
    const payment = await createPayment(
      values,
      businessId,
      deviceId,
      repository,
      null,
    );

    expect(payment.appointmentId).toBeNull();
    expect(payment.amount).toBe(15050);
  });

  it("rechaza un monto que excede el saldo de la cita", async () => {
    const repository = new FakePaymentRepository();

    await expect(
      createPayment(
        { ...values, appointmentId, amount: 200 },
        businessId,
        deviceId,
        repository,
        15000,
      ),
    ).rejects.toBeInstanceOf(PaymentExceedsBalanceError);
  });

  it("acepta un monto igual al saldo pendiente", async () => {
    const repository = new FakePaymentRepository();
    const payment = await createPayment(
      { ...values, appointmentId, amount: 150 },
      businessId,
      deviceId,
      repository,
      15000,
    );

    expect(payment.amount).toBe(15000);
    expect(payment.appointmentId).toBe(appointmentId);
  });
});

describe("voidPayment", () => {
  it("marca la fecha de anulación e incrementa la versión", async () => {
    const repository = new FakePaymentRepository();
    const current = makePayment(15000);

    const payment = await voidPayment(current, repository);

    expect(payment.deletedAt).not.toBeNull();
    expect(payment.version).toBe(current.version + 1);
    expect(repository.voided).toEqual(payment);
  });
});
