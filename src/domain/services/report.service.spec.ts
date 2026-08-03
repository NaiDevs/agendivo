import { describe, expect, it } from "vitest";

import {
  APPOINTMENT_STATUS,
  type Appointment,
} from "@/domain/entities/appointment";
import { EXPENSE_CATEGORY, type Expense } from "@/domain/entities/expense";
import { PAYMENT_METHOD, type Payment } from "@/domain/entities/payment";
import { dailyReport, monthlyReport } from "@/domain/services/report.service";

const TZ = "America/Guatemala"; // UTC-6
const D = "d0000000-0000-4000-8000-000000000001";

function payment(
  id: string,
  paidAt: string,
  method: Payment["method"],
  amount: number,
): Payment {
  return {
    id,
    businessId: "b",
    appointmentId: null,
    customerId: "c",
    amount,
    method,
    paidAt,
    notes: null,
    createdAt: paidAt,
    updatedAt: paidAt,
    deletedAt: null,
    version: 1,
    deviceId: D,
  };
}

function expense(
  id: string,
  spentAt: string,
  category: Expense["category"],
  amount: number,
): Expense {
  return {
    id,
    businessId: "b",
    category,
    description: null,
    amount,
    spentAt,
    createdAt: spentAt,
    updatedAt: spentAt,
    deletedAt: null,
    version: 1,
    deviceId: D,
  };
}

function appointment(
  id: string,
  startsAt: string,
  status: Appointment["status"],
): Appointment {
  return {
    id,
    businessId: "b",
    customerId: "c",
    employeeId: null,
    serviceId: null,
    startsAt,
    endsAt: startsAt,
    status,
    price: 0,
    notes: null,
    createdAt: startsAt,
    updatedAt: startsAt,
    deletedAt: null,
    version: 1,
    deviceId: D,
  };
}

const input = {
  timeZone: TZ,
  payments: [
    payment("p0", "2026-08-04T03:00:00.000Z", PAYMENT_METHOD.CASH, 1000), // local Ago 3
    payment("p1", "2026-08-04T14:00:00.000Z", PAYMENT_METHOD.CASH, 5000), // local Ago 4
    payment("p2", "2026-08-04T16:00:00.000Z", PAYMENT_METHOD.CARD, 3000), // local Ago 4
    payment("p3", "2026-08-05T14:00:00.000Z", PAYMENT_METHOD.CASH, 2000), // local Ago 5
  ],
  expenses: [
    expense("e1", "2026-08-04T15:00:00.000Z", EXPENSE_CATEGORY.SUPPLIES, 2000), // Ago 4
    expense("e2", "2026-08-04T18:00:00.000Z", EXPENSE_CATEGORY.RENT, 1000), // Ago 4
    expense("e3", "2026-08-06T15:00:00.000Z", EXPENSE_CATEGORY.SUPPLIES, 500), // Ago 6
  ],
  appointments: [
    appointment("a1", "2026-08-04T15:00:00.000Z", APPOINTMENT_STATUS.CONFIRMED),
    appointment("a2", "2026-08-04T16:00:00.000Z", APPOINTMENT_STATUS.CANCELLED),
    appointment("a3", "2026-08-05T15:00:00.000Z", APPOINTMENT_STATUS.CONFIRMED),
  ],
};

describe("dailyReport", () => {
  it("suma ingresos, egresos y balance del día según la timezone", () => {
    const report = dailyReport("2026-08-04", input);
    expect(report.incomeTotal).toBe(8000);
    expect(report.expenseTotal).toBe(3000);
    expect(report.balance).toBe(5000);
    expect(report.paymentCount).toBe(2);
  });

  it("cuenta citas del día excluyendo canceladas y no-show", () => {
    const report = dailyReport("2026-08-04", input);
    expect(report.appointmentCount).toBe(1);
  });

  it("desglosa ingresos por método y egresos por categoría, ordenados desc", () => {
    const report = dailyReport("2026-08-04", input);
    expect(report.incomeByMethod).toEqual([
      { method: PAYMENT_METHOD.CASH, total: 5000 },
      { method: PAYMENT_METHOD.CARD, total: 3000 },
    ]);
    expect(report.expenseByCategory).toEqual([
      { category: EXPENSE_CATEGORY.SUPPLIES, total: 2000 },
      { category: EXPENSE_CATEGORY.RENT, total: 1000 },
    ]);
  });

  it("devuelve todo en cero para un día sin movimientos", () => {
    const report = dailyReport("2026-08-20", input);
    expect(report.incomeTotal).toBe(0);
    expect(report.expenseTotal).toBe(0);
    expect(report.balance).toBe(0);
    expect(report.paymentCount).toBe(0);
    expect(report.incomeByMethod).toEqual([]);
    expect(report.expenseByCategory).toEqual([]);
  });
});

describe("monthlyReport", () => {
  it("agrega los totales del mes", () => {
    const report = monthlyReport("2026-08", input);
    expect(report.incomeTotal).toBe(11000);
    expect(report.expenseTotal).toBe(3500);
    expect(report.balance).toBe(7500);
    expect(report.paymentCount).toBe(4);
    expect(report.appointmentCount).toBe(2);
  });

  it("desglosa por día solo los días con movimiento, en orden ascendente", () => {
    const report = monthlyReport("2026-08", input);
    expect(report.days.map((day) => day.date)).toEqual([
      "2026-08-03",
      "2026-08-04",
      "2026-08-05",
      "2026-08-06",
    ]);
    expect(report.days[1]).toEqual({
      date: "2026-08-04",
      income: 8000,
      expense: 3000,
      balance: 5000,
    });
    expect(report.days[3]).toEqual({
      date: "2026-08-06",
      income: 0,
      expense: 500,
      balance: -500,
    });
  });
});
