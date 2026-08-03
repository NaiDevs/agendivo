import { describe, expect, it } from "vitest";

import { EXPENSE_CATEGORY } from "@/domain/entities/expense";
import { PAYMENT_METHOD } from "@/domain/entities/payment";
import type {
  FinanceSummary,
  MonthlyReport,
} from "@/domain/services/report.service";
import {
  dailyReportRows,
  monthlyReportRows,
} from "@/features/reports/report-export";

const labels = {
  method: (method: string) =>
    method === PAYMENT_METHOD.CASH ? "Efectivo" : "Tarjeta",
  category: (category: string) =>
    category === EXPENSE_CATEGORY.SUPPLIES ? "Insumos" : "Renta",
};

const summary: FinanceSummary = {
  incomeTotal: 8000,
  expenseTotal: 3000,
  balance: 5000,
  paymentCount: 2,
  appointmentCount: 1,
  incomeByMethod: [{ method: PAYMENT_METHOD.CASH, total: 5000 }],
  expenseByCategory: [{ category: EXPENSE_CATEGORY.SUPPLIES, total: 2000 }],
};

describe("dailyReportRows", () => {
  it("encabeza con el título y la fecha", () => {
    const rows = dailyReportRows("2026-08-04", summary, labels);
    expect(rows[0]).toEqual(["Reporte diario", "2026-08-04"]);
  });

  it("incluye los totales en unidades mayores (no centavos)", () => {
    const rows = dailyReportRows("2026-08-04", summary, labels);
    expect(rows).toContainEqual(["Ingresos", 80]);
    expect(rows).toContainEqual(["Egresos", 30]);
    expect(rows).toContainEqual(["Balance", 50]);
  });

  it("incluye los desgloses con etiquetas legibles", () => {
    const rows = dailyReportRows("2026-08-04", summary, labels);
    expect(rows).toContainEqual(["Efectivo", 50]);
    expect(rows).toContainEqual(["Insumos", 20]);
  });
});

describe("monthlyReportRows", () => {
  const monthly: MonthlyReport = {
    ...summary,
    days: [{ date: "2026-08-04", income: 8000, expense: 3000, balance: 5000 }],
  };

  it("encabeza con el título y el mes", () => {
    const rows = monthlyReportRows("2026-08", monthly, labels);
    expect(rows[0]).toEqual(["Reporte mensual", "2026-08"]);
  });

  it("incluye una fila por día con ingresos, egresos y balance", () => {
    const rows = monthlyReportRows("2026-08", monthly, labels);
    expect(rows).toContainEqual(["2026-08-04", 80, 30, 50]);
  });
});
