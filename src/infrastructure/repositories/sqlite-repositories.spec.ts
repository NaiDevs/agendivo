import { describe, expect, it } from "vitest";

import type { Business } from "@/domain/entities/business";
import { EXPENSE_CATEGORY, type Expense } from "@/domain/entities/expense";
import {
  PAYMENT_DOCUMENT_TYPE,
  PAYMENT_METHOD,
  type Payment,
} from "@/domain/entities/payment";
import type {
  DatabaseClient,
  DatabaseExecutionResult,
} from "@/infrastructure/database/database-client";
import { SqliteBusinessRepository } from "@/infrastructure/repositories/sqlite-business.repository";
import { SqliteAppointmentRepository } from "@/infrastructure/repositories/sqlite-appointment.repository";
import { SqliteCustomerRepository } from "@/infrastructure/repositories/sqlite-customer.repository";
import { SqliteEmployeeRepository } from "@/infrastructure/repositories/sqlite-employee.repository";
import { SqliteExpenseRepository } from "@/infrastructure/repositories/sqlite-expense.repository";
import { SqlitePaymentRepository } from "@/infrastructure/repositories/sqlite-payment.repository";
import { SqliteServiceRepository } from "@/infrastructure/repositories/sqlite-service.repository";

class FakeDatabase implements DatabaseClient {
  selectedRows: unknown = [];
  lastQuery: string | null = null;
  lastBindValues: unknown[] | undefined;

  async select<T>(query: string, bindValues?: unknown[]): Promise<T> {
    this.lastQuery = query;
    this.lastBindValues = bindValues;
    return this.selectedRows as T;
  }

  async execute(
    query: string,
    bindValues?: unknown[],
  ): Promise<DatabaseExecutionResult> {
    this.lastQuery = query;
    this.lastBindValues = bindValues;
    return { rowsAffected: 1 };
  }
}

const business: Business = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Barbería Central",
  phone: null,
  email: null,
  address: null,
  timezone: "America/Guatemala",
  currency: "GTQ",
  createdAt: "2026-08-03T04:00:00.000Z",
  updatedAt: "2026-08-03T04:00:00.000Z",
  deletedAt: null,
  version: 1,
  deviceId: "22222222-2222-4222-8222-222222222222",
};

describe("SqliteBusinessRepository", () => {
  it("mapea una fila SQLite a la entidad de dominio", async () => {
    const database = new FakeDatabase();
    database.selectedRows = [
      {
        id: business.id,
        name: business.name,
        phone: null,
        email: null,
        address: null,
        timezone: business.timezone,
        currency: business.currency,
        created_at: business.createdAt,
        updated_at: business.updatedAt,
        deleted_at: null,
        version: 1,
        device_id: business.deviceId,
      },
    ];
    const repository = new SqliteBusinessRepository(database);

    await expect(repository.findActive()).resolves.toEqual(business);
  });

  it("inserta todos los campos de sincronización", async () => {
    const database = new FakeDatabase();
    const repository = new SqliteBusinessRepository(database);

    await repository.create(business);

    expect(database.lastQuery).toContain("INSERT INTO businesses");
    expect(database.lastBindValues).toEqual([
      business.id,
      business.name,
      null,
      null,
      null,
      business.timezone,
      business.currency,
      business.createdAt,
      business.updatedAt,
      null,
      1,
      business.deviceId,
    ]);
  });
});

describe("SqliteAppointmentRepository", () => {
  it("busca cruces excluyendo la cita editada", async () => {
    const database = new FakeDatabase();
    const repository = new SqliteAppointmentRepository(database);
    const appointmentId = "66666666-6666-4666-8666-666666666666";

    await repository.hasOverlap(
      "22222222-2222-4222-8222-222222222222",
      "2026-08-04T16:00:00.000Z",
      "2026-08-04T16:45:00.000Z",
      appointmentId,
    );

    expect(database.lastQuery).toContain(
      "status NOT IN ('cancelled', 'no_show')",
    );
    expect(database.lastBindValues).toEqual([
      "22222222-2222-4222-8222-222222222222",
      "2026-08-04T16:45:00.000Z",
      "2026-08-04T16:00:00.000Z",
      appointmentId,
      appointmentId,
    ]);
  });
});

describe("SqliteCustomerRepository", () => {
  it("filtra por negocio y excluye borrados lógicos", async () => {
    const database = new FakeDatabase();
    const repository = new SqliteCustomerRepository(database);

    await repository.findActiveByBusiness(business.id);

    expect(database.lastQuery).toContain("deleted_at IS NULL");
    expect(database.lastBindValues).toEqual([business.id]);
  });
});

describe("SqliteEmployeeRepository", () => {
  it("filtra empleados activos por negocio", async () => {
    const database = new FakeDatabase();
    const repository = new SqliteEmployeeRepository(database);

    await repository.findActiveByBusiness(business.id);

    expect(database.lastQuery).toContain("FROM employees");
    expect(database.lastQuery).toContain("deleted_at IS NULL");
    expect(database.lastBindValues).toEqual([business.id]);
  });
});

describe("SqliteServiceRepository", () => {
  it("filtra servicios activos por negocio", async () => {
    const database = new FakeDatabase();
    const repository = new SqliteServiceRepository(database);

    await repository.findActiveByBusiness(business.id);

    expect(database.lastQuery).toContain("FROM services");
    expect(database.lastQuery).toContain("deleted_at IS NULL");
    expect(database.lastBindValues).toEqual([business.id]);
  });
});

const payment: Payment = {
  id: "77777777-7777-4777-8777-777777777777",
  businessId: business.id,
  appointmentId: "66666666-6666-4666-8666-666666666666",
  customerId: "88888888-8888-4888-8888-888888888888",
  amount: 15000,
  method: PAYMENT_METHOD.CASH,
  paidAt: "2026-08-04T10:30:00.000Z",
  notes: null,
  documentType: PAYMENT_DOCUMENT_TYPE.RECEIPT,
  fiscalInvoice: null,
  serviceItems: [],
  createdAt: "2026-08-04T10:30:00.000Z",
  updatedAt: "2026-08-04T10:30:00.000Z",
  deletedAt: null,
  version: 1,
  deviceId: business.deviceId,
};

describe("SqlitePaymentRepository", () => {
  it("filtra pagos activos por negocio", async () => {
    const database = new FakeDatabase();
    const repository = new SqlitePaymentRepository(database);

    await repository.findActiveByBusiness(business.id);

    expect(database.lastQuery).toContain("FROM payments");
    expect(database.lastQuery).toContain("deleted_at IS NULL");
    expect(database.lastBindValues).toEqual([business.id]);
  });

  it("busca pagos activos de una cita", async () => {
    const database = new FakeDatabase();
    const repository = new SqlitePaymentRepository(database);

    await repository.findByAppointment(payment.appointmentId as string);

    expect(database.lastQuery).toContain("appointment_id = ?");
    expect(database.lastQuery).toContain("deleted_at IS NULL");
    expect(database.lastBindValues).toEqual([payment.appointmentId]);
  });

  it("inserta todos los campos de sincronización", async () => {
    const database = new FakeDatabase();
    const repository = new SqlitePaymentRepository(database);

    await repository.create(payment);

    expect(database.lastQuery).toContain("INSERT INTO payments");
    expect(database.lastBindValues).toEqual([
      payment.id,
      payment.businessId,
      payment.appointmentId,
      payment.customerId,
      payment.amount,
      payment.method,
      payment.paidAt,
      payment.notes,
      payment.documentType,
      payment.fiscalInvoice,
      JSON.stringify(payment.serviceItems),
      payment.createdAt,
      payment.updatedAt,
      payment.deletedAt,
      payment.version,
      payment.deviceId,
    ]);
  });

  it("anula un pago marcando el borrado lógico", async () => {
    const database = new FakeDatabase();
    const repository = new SqlitePaymentRepository(database);
    const voided: Payment = {
      ...payment,
      deletedAt: "2026-08-05T00:00:00.000Z",
    };

    await repository.void(voided);

    const bindValues = database.lastBindValues ?? [];
    expect(database.lastQuery).toContain("UPDATE payments SET");
    expect(bindValues[12]).toBe(voided.deletedAt);
    expect(bindValues[bindValues.length - 1]).toBe(voided.id);
  });

  it("convierte un recibo en factura dentro del mismo negocio", async () => {
    const database = new FakeDatabase();
    const repository = new SqlitePaymentRepository(database);
    const invoice: Payment = {
      ...payment,
      documentType: PAYMENT_DOCUMENT_TYPE.FISCAL_INVOICE,
      fiscalInvoice: {
        authorizationId: "80000000-0000-4000-8000-000000000001",
        cai: "ABC123-DEF456-GHI789-JKL012-MNO345-PQ",
        correlative: 7,
        emissionPointCode: "002",
        establishmentCode: "001",
        issuedDate: "2026-08-16",
        legalName: "Nai Servicios, S. de R.L.",
        number: "001-002-01-00000007",
        rangeEnd: 100,
        rangeStart: 1,
        taxId: "08011999123456",
        validUntil: "2027-08-09",
      },
    };

    await repository.issueFiscalInvoice(invoice);

    expect(database.lastQuery).toContain("document_type = 'receipt'");
    expect(database.lastQuery).toContain("business_id = ?");
    const bindValues = database.lastBindValues ?? [];
    expect(bindValues[bindValues.length - 2]).toBe(invoice.id);
    expect(bindValues[bindValues.length - 1]).toBe(invoice.businessId);
  });
});

const expense: Expense = {
  id: "99999999-9999-4999-8999-999999999999",
  businessId: business.id,
  category: EXPENSE_CATEGORY.SUPPLIES,
  description: "Shampoo",
  amount: 32050,
  spentAt: "2026-08-04T10:30:00.000Z",
  createdAt: "2026-08-04T10:30:00.000Z",
  updatedAt: "2026-08-04T10:30:00.000Z",
  deletedAt: null,
  version: 1,
  deviceId: business.deviceId,
};

describe("SqliteExpenseRepository", () => {
  it("filtra gastos activos por negocio", async () => {
    const database = new FakeDatabase();
    const repository = new SqliteExpenseRepository(database);

    await repository.findActiveByBusiness(business.id);

    expect(database.lastQuery).toContain("FROM expenses");
    expect(database.lastQuery).toContain("deleted_at IS NULL");
    expect(database.lastBindValues).toEqual([business.id]);
  });

  it("inserta todos los campos de sincronización", async () => {
    const database = new FakeDatabase();
    const repository = new SqliteExpenseRepository(database);

    await repository.create(expense);

    expect(database.lastQuery).toContain("INSERT INTO expenses");
    expect(database.lastBindValues).toEqual([
      expense.id,
      expense.businessId,
      expense.category,
      expense.description,
      expense.amount,
      expense.spentAt,
      expense.createdAt,
      expense.updatedAt,
      expense.deletedAt,
      expense.version,
      expense.deviceId,
    ]);
  });

  it("actualiza un gasto conservando el id al final", async () => {
    const database = new FakeDatabase();
    const repository = new SqliteExpenseRepository(database);

    await repository.update({ ...expense, amount: 999 });

    const bindValues = database.lastBindValues ?? [];
    expect(database.lastQuery).toContain("UPDATE expenses SET");
    expect(bindValues[bindValues.length - 1]).toBe(expense.id);
  });

  it("elimina un gasto marcando el borrado lógico", async () => {
    const database = new FakeDatabase();
    const repository = new SqliteExpenseRepository(database);
    const removed: Expense = {
      ...expense,
      deletedAt: "2026-08-05T00:00:00.000Z",
    };

    await repository.delete(removed);

    const bindValues = database.lastBindValues ?? [];
    expect(database.lastQuery).toContain("UPDATE expenses SET");
    expect(bindValues[7]).toBe(removed.deletedAt);
    expect(bindValues[bindValues.length - 1]).toBe(removed.id);
  });
});
