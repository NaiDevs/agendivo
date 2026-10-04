import { describe, expect, it } from "vitest";

import {
  PAYMENT_DOCUMENT_TYPE,
  PAYMENT_METHOD,
  type Payment,
} from "@/domain/entities/payment";
import { PaymentExceedsBalanceError } from "@/domain/errors/payment-exceeds-balance.error";
import type { PaymentRepository } from "@/domain/repositories/payment.repository";
import {
  createPayment,
  issueFiscalInvoice,
  pendingBalance,
  reflectIssuedFiscalInvoice,
  voidPayment,
} from "@/domain/services/payment.service";
import type { FiscalConfiguration } from "@/domain/entities/fiscal-configuration";

class FakePaymentRepository implements PaymentRepository {
  created: Payment | null = null;
  issued: Payment | null = null;
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
  async issueFiscalInvoice(payment: Payment): Promise<void> {
    this.issued = payment;
  }
  async void(payment: Payment): Promise<void> {
    this.voided = payment;
  }
}

const businessId = "44444444-4444-4444-8444-444444444444";
const deviceId = "55555555-5555-4555-8555-555555555555";
const appointmentId = "22222222-2222-4222-8222-222222222222";

const fiscalConfiguration: FiscalConfiguration = {
  profile: {
    id: "60000000-0000-4000-8000-000000000001",
    businessId,
    countryCode: "HN",
    legalName: "Nai Servicios, S. de R.L.",
    taxId: "08011999123456",
    invoicesEnabled: true,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    deletedAt: null,
    version: 1,
    deviceId,
  },
  emissionPoint: {
    id: "70000000-0000-4000-8000-000000000001",
    businessId,
    name: "Caja principal",
    establishmentCode: "001",
    emissionPointCode: "002",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    deletedAt: null,
    version: 1,
    deviceId,
  },
  authorization: {
    id: "80000000-0000-4000-8000-000000000001",
    businessId,
    emissionPointId: "70000000-0000-4000-8000-000000000001",
    cai: "ABC123-DEF456-GHI789-JKL012-MNO345-PQ",
    documentType: "invoice",
    rangeStart: 1,
    rangeEnd: 100,
    nextNumber: 7,
    validUntil: "2027-08-09",
    active: true,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    deletedAt: null,
    version: 1,
    deviceId,
  },
};

const values = {
  customerId: "11111111-1111-4111-8111-111111111111",
  appointmentId: "",
  serviceIds: [],
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
    documentType: PAYMENT_DOCUMENT_TYPE.RECEIPT,
    fiscalInvoice: null,
    serviceItems: [],
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

  it("genera una instantánea fiscal con el correlativo activo", async () => {
    const payment = await createPayment(
      values,
      businessId,
      deviceId,
      new FakePaymentRepository(),
      null,
      fiscalConfiguration,
    );

    expect(payment.documentType).toBe(PAYMENT_DOCUMENT_TYPE.FISCAL_INVOICE);
    expect(payment.fiscalInvoice?.number).toBe("001-002-01-00000007");
    expect(payment.fiscalInvoice?.issuedDate).toBe("2026-08-04");
    expect(payment.fiscalInvoice?.cai).toBe(
      fiscalConfiguration.authorization?.cai,
    );

    const advanced = reflectIssuedFiscalInvoice(fiscalConfiguration, payment);
    expect(advanced.authorization?.nextNumber).toBe(8);
    expect(advanced.authorization?.version).toBe(2);
  });

  it("rechaza una autorización fiscal vencida", async () => {
    await expect(
      createPayment(
        values,
        businessId,
        deviceId,
        new FakePaymentRepository(),
        null,
        {
          ...fiscalConfiguration,
          authorization: {
            ...(fiscalConfiguration.authorization as NonNullable<
              FiscalConfiguration["authorization"]
            >),
            validUntil: "2025-01-01",
          },
        },
      ),
    ).rejects.toThrow("autorización fiscal está vencida");
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

describe("issueFiscalInvoice", () => {
  it("convierte un recibo usando el correlativo fiscal activo", async () => {
    const repository = new FakePaymentRepository();
    const receipt = makePayment(15000);

    const invoice = await issueFiscalInvoice(
      receipt,
      fiscalConfiguration,
      deviceId,
      repository,
      "2026-08-16",
    );

    expect(invoice.documentType).toBe(PAYMENT_DOCUMENT_TYPE.FISCAL_INVOICE);
    expect(invoice.fiscalInvoice?.number).toBe("001-002-01-00000007");
    expect(invoice.fiscalInvoice?.issuedDate).toBe("2026-08-16");
    expect(invoice.version).toBe(receipt.version + 1);
    expect(repository.issued).toEqual(invoice);
  });

  it("no vuelve a consumir correlativo si el pago ya es factura", async () => {
    const repository = new FakePaymentRepository();
    const receipt = makePayment(15000);
    const invoice = await issueFiscalInvoice(
      receipt,
      fiscalConfiguration,
      deviceId,
      repository,
      "2026-08-16",
    );
    repository.issued = null;

    const result = await issueFiscalInvoice(
      invoice,
      fiscalConfiguration,
      deviceId,
      repository,
      "2026-08-16",
    );

    expect(result).toBe(invoice);
    expect(repository.issued).toBeNull();
  });
});
