import type { Expense } from "@/domain/entities/expense";
import type { ExpenseRepository } from "@/domain/repositories/expense.repository";
import {
  expenseFormSchema,
  type ExpenseFormValues,
} from "@/schemas/expense.schema";

export async function createExpense(
  values: ExpenseFormValues,
  businessId: string,
  deviceId: string,
  repository: ExpenseRepository,
): Promise<Expense> {
  const input = expenseFormSchema.parse(values);
  const now = new Date().toISOString();
  const expense: Expense = {
    id: crypto.randomUUID(),
    businessId,
    category: input.category,
    description: input.description === "" ? null : input.description,
    amount: Math.round(input.amount * 100),
    spentAt: new Date(input.spentAt).toISOString(),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    version: 1,
    deviceId,
  };

  await repository.create(expense);
  return expense;
}

export async function updateExpense(
  current: Expense,
  values: ExpenseFormValues,
  repository: ExpenseRepository,
): Promise<Expense> {
  const input = expenseFormSchema.parse(values);
  const expense: Expense = {
    ...current,
    category: input.category,
    description: input.description === "" ? null : input.description,
    amount: Math.round(input.amount * 100),
    spentAt: new Date(input.spentAt).toISOString(),
    updatedAt: new Date().toISOString(),
    version: current.version + 1,
  };

  await repository.update(expense);
  return expense;
}

export async function deleteExpense(
  current: Expense,
  repository: ExpenseRepository,
): Promise<Expense> {
  const now = new Date().toISOString();
  const expense: Expense = {
    ...current,
    deletedAt: now,
    updatedAt: now,
    version: current.version + 1,
  };
  await repository.delete(expense);
  return expense;
}
