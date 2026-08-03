import {
  APPOINTMENT_STATUS,
  type Appointment,
} from "@/domain/entities/appointment";
import type { ExpenseCategory, Expense } from "@/domain/entities/expense";
import type { PaymentMethod, Payment } from "@/domain/entities/payment";
import { localDateKey, localMonthKey } from "@/lib/local-date";

export interface FinanceSummary {
  incomeTotal: number;
  expenseTotal: number;
  balance: number;
  paymentCount: number;
  appointmentCount: number;
  incomeByMethod: { method: PaymentMethod; total: number }[];
  expenseByCategory: { category: ExpenseCategory; total: number }[];
}

export interface MonthlyReport extends FinanceSummary {
  days: { date: string; income: number; expense: number; balance: number }[];
}

export interface ReportInput {
  payments: Payment[];
  expenses: Expense[];
  appointments: Appointment[];
  timeZone: string;
}

const COUNTED_STATUSES: Appointment["status"][] = [
  APPOINTMENT_STATUS.PENDING,
  APPOINTMENT_STATUS.CONFIRMED,
  APPOINTMENT_STATUS.COMPLETED,
];

function sum<T>(items: T[], amount: (item: T) => number): number {
  return items.reduce((total, item) => total + amount(item), 0);
}

function groupTotals<K extends string>(
  items: { key: K; amount: number }[],
): { key: K; total: number }[] {
  const totals = new Map<K, number>();
  for (const item of items) {
    totals.set(item.key, (totals.get(item.key) ?? 0) + item.amount);
  }
  return [...totals.entries()]
    .filter(([, total]) => total > 0)
    .map(([key, total]) => ({ key, total }))
    .sort((left, right) => right.total - left.total);
}

function summarize(
  payments: Payment[],
  expenses: Expense[],
  appointments: Appointment[],
): FinanceSummary {
  const incomeTotal = sum(payments, (payment) => payment.amount);
  const expenseTotal = sum(expenses, (expense) => expense.amount);
  const incomeByMethod = groupTotals(
    payments.map((payment) => ({
      key: payment.method,
      amount: payment.amount,
    })),
  ).map(({ key, total }) => ({ method: key, total }));
  const expenseByCategory = groupTotals(
    expenses.map((expense) => ({
      key: expense.category,
      amount: expense.amount,
    })),
  ).map(({ key, total }) => ({ category: key, total }));

  return {
    incomeTotal,
    expenseTotal,
    balance: incomeTotal - expenseTotal,
    paymentCount: payments.length,
    appointmentCount: appointments.filter((appointment) =>
      COUNTED_STATUSES.includes(appointment.status),
    ).length,
    incomeByMethod,
    expenseByCategory,
  };
}

export function dailyReport(date: string, input: ReportInput): FinanceSummary {
  const { timeZone } = input;
  const onDate = (iso: string): boolean => localDateKey(iso, timeZone) === date;
  return summarize(
    input.payments.filter((payment) => onDate(payment.paidAt)),
    input.expenses.filter((expense) => onDate(expense.spentAt)),
    input.appointments.filter((appointment) => onDate(appointment.startsAt)),
  );
}

export function monthlyReport(
  yearMonth: string,
  input: ReportInput,
): MonthlyReport {
  const { timeZone } = input;
  const inMonth = (iso: string): boolean =>
    localMonthKey(iso, timeZone) === yearMonth;
  const payments = input.payments.filter((payment) => inMonth(payment.paidAt));
  const expenses = input.expenses.filter((expense) => inMonth(expense.spentAt));
  const appointments = input.appointments.filter((appointment) =>
    inMonth(appointment.startsAt),
  );

  const byDay = new Map<string, { income: number; expense: number }>();
  const ensure = (date: string): { income: number; expense: number } => {
    const current = byDay.get(date) ?? { income: 0, expense: 0 };
    byDay.set(date, current);
    return current;
  };
  for (const payment of payments) {
    ensure(localDateKey(payment.paidAt, timeZone)).income += payment.amount;
  }
  for (const expense of expenses) {
    ensure(localDateKey(expense.spentAt, timeZone)).expense += expense.amount;
  }

  const days = [...byDay.entries()]
    .map(([date, totals]) => ({
      date,
      income: totals.income,
      expense: totals.expense,
      balance: totals.income - totals.expense,
    }))
    .sort((left, right) => left.date.localeCompare(right.date));

  return { ...summarize(payments, expenses, appointments), days };
}
