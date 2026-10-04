import { describe, expect, it } from "vitest";

import type { Appointment } from "@/domain/entities/appointment";
import type { Business } from "@/domain/entities/business";
import type { Customer } from "@/domain/entities/customer";
import {
  EMPLOYEE_ACCOUNT_ROLE,
  type Employee,
} from "@/domain/entities/employee";
import {
  PAYMENT_DOCUMENT_TYPE,
  PAYMENT_METHOD,
  type Payment,
} from "@/domain/entities/payment";
import type { Service } from "@/domain/entities/service";
import { buildPaymentReceiptData } from "@/features/payments/payment-receipt-data";

const sync = {
  createdAt: "2026-08-16T10:00:00.000Z",
  updatedAt: "2026-08-16T10:00:00.000Z",
  deletedAt: null,
  version: 1,
  deviceId: "22222222-2222-4222-8222-222222222222",
};

const business: Business = {
  ...sync,
  id: "11111111-1111-4111-8111-111111111111",
  name: "Estudio Nai",
  phone: "9999-9999",
  email: "hola@nai.test",
  address: "Centro",
  timezone: "America/Tegucigalpa",
  currency: "HNL",
};

const customer: Customer = {
  ...sync,
  id: "33333333-3333-4333-8333-333333333333",
  businessId: business.id,
  name: "Ana López",
  phone: "8888-8888",
  email: null,
  notes: null,
  customFieldValues: {},
};

const appointment: Appointment = {
  ...sync,
  id: "44444444-4444-4444-8444-444444444444",
  businessId: business.id,
  customerId: customer.id,
  employeeId: "55555555-5555-4555-8555-555555555555",
  serviceId: "66666666-6666-4666-8666-666666666666",
  serviceItems: [],
  startsAt: "2026-08-16T15:00:00.000Z",
  endsAt: "2026-08-16T15:30:00.000Z",
  status: "completed",
  price: 10_000,
  notes: null,
};

const employee: Employee = {
  ...sync,
  id: appointment.employeeId as string,
  businessId: business.id,
  name: "María",
  phone: null,
  email: null,
  color: "copper",
  userId: null,
  accountRole: EMPLOYEE_ACCOUNT_ROLE.EMPLOYEE,
};

const service: Service = {
  ...sync,
  id: appointment.serviceId as string,
  businessId: business.id,
  name: "Corte normal",
  description: null,
  durationMinutes: 30,
  price: appointment.price,
};

const payment: Payment = {
  ...sync,
  id: "77777777-7777-4777-8777-777777777777",
  businessId: business.id,
  appointmentId: appointment.id,
  customerId: customer.id,
  amount: 6_000,
  method: PAYMENT_METHOD.CASH,
  paidAt: "2026-08-16T15:30:00.000Z",
  notes: null,
  documentType: PAYMENT_DOCUMENT_TYPE.RECEIPT,
  fiscalInvoice: null,
  serviceItems: [],
};

describe("buildPaymentReceiptData", () => {
  it("adapta una cita y calcula el saldo después del pago", () => {
    const result = buildPaymentReceiptData({
      appointment,
      business,
      customer,
      employee,
      payment,
      payments: [payment],
      service,
    });

    expect(result.folio).toBe("REC-7777777777");
    expect(result.serviceItems[0]?.name).toBe("Corte normal");
    expect(result.appointment?.employeeName).toBe("María");
    expect(result.serviceAmount).toBe(10_000);
    expect(result.paidAmount).toBe(6_000);
    expect(result.balanceAfterPayment).toBe(4_000);
  });

  it("usa el número y título fiscal guardados en el pago", () => {
    const fiscalPayment: Payment = {
      ...payment,
      documentType: PAYMENT_DOCUMENT_TYPE.FISCAL_INVOICE,
      fiscalInvoice: {
        authorizationId: "88888888-8888-4888-8888-888888888888",
        cai: "ABC123-DEF456-GHI789-JKL012-MNO345-PQ",
        correlative: 7,
        emissionPointCode: "002",
        establishmentCode: "001",
        issuedDate: "2026-08-16",
        legalName: "Estudio Nai, S. de R.L.",
        number: "001-002-01-00000007",
        rangeEnd: 100,
        rangeStart: 1,
        taxId: "08011999123456",
        validUntil: "2027-08-09",
      },
    };

    const result = buildPaymentReceiptData({
      appointment,
      business,
      customer,
      employee,
      payment: fiscalPayment,
      payments: [fiscalPayment],
      service,
    });

    expect(result.documentTitle).toBe("Factura fiscal");
    expect(result.folio).toBe("001-002-01-00000007");
    expect(result.fiscalInvoice?.taxId).toBe("08011999123456");
  });
});
