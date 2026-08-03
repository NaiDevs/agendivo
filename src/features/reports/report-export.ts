import type { ExpenseCategory } from "@/domain/entities/expense";
import type { PaymentMethod } from "@/domain/entities/payment";
import type {
  FinanceSummary,
  MonthlyReport,
} from "@/domain/services/report.service";

export interface ReportLabels {
  method: (method: PaymentMethod) => string;
  category: (category: ExpenseCategory) => string;
}

type Row = (string | number)[];

function money(cents: number): number {
  return cents / 100;
}

function summaryRows(summary: FinanceSummary, labels: ReportLabels): Row[] {
  return [
    [],
    ["Ingresos", money(summary.incomeTotal)],
    ["Egresos", money(summary.expenseTotal)],
    ["Balance", money(summary.balance)],
    ["Citas", summary.appointmentCount],
    ["Pagos", summary.paymentCount],
    [],
    ["Ingresos por método"],
    ...summary.incomeByMethod.map((item): Row => [
      labels.method(item.method),
      money(item.total),
    ]),
    [],
    ["Egresos por categoría"],
    ...summary.expenseByCategory.map((item): Row => [
      labels.category(item.category),
      money(item.total),
    ]),
  ];
}

export function dailyReportRows(
  date: string,
  report: FinanceSummary,
  labels: ReportLabels,
): Row[] {
  return [["Reporte diario", date], ...summaryRows(report, labels)];
}

export function monthlyReportRows(
  month: string,
  report: MonthlyReport,
  labels: ReportLabels,
): Row[] {
  return [
    ["Reporte mensual", month],
    ...summaryRows(report, labels),
    [],
    ["Detalle diario"],
    ["Día", "Ingresos", "Egresos", "Balance"],
    ...report.days.map((day): Row => [
      day.date,
      money(day.income),
      money(day.expense),
      money(day.balance),
    ]),
  ];
}
