import { z } from "zod";

import { EXPENSE_CATEGORY, type Expense } from "@/domain/entities/expense";
import type { ExpenseRepository } from "@/domain/repositories/expense.repository";
import type { DatabaseClient } from "@/infrastructure/database/database-client";

const expenseRowSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  category: z.enum([
    EXPENSE_CATEGORY.SUPPLIES,
    EXPENSE_CATEGORY.RENT,
    EXPENSE_CATEGORY.UTILITIES,
    EXPENSE_CATEGORY.SALARIES,
    EXPENSE_CATEGORY.OTHER,
  ]),
  description: z.string().nullable(),
  amount: z.number().int().positive(),
  spent_at: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
  version: z.number().int().positive(),
  device_id: z.string().uuid(),
});

type ExpenseRow = z.infer<typeof expenseRowSchema>;

function mapExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    businessId: row.business_id,
    category: row.category,
    description: row.description,
    amount: row.amount,
    spentAt: row.spent_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    version: row.version,
    deviceId: row.device_id,
  };
}

const SELECT_COLUMNS = `id, business_id, category, description, amount, spent_at,
        created_at, updated_at, deleted_at, version, device_id`;

export class SqliteExpenseRepository implements ExpenseRepository {
  constructor(private readonly database: DatabaseClient) {}

  async findActiveByBusiness(businessId: string): Promise<Expense[]> {
    const rows = await this.database.select<unknown[]>(
      `SELECT ${SELECT_COLUMNS}
       FROM expenses
       WHERE business_id = ? AND deleted_at IS NULL
       ORDER BY spent_at DESC`,
      [businessId],
    );
    return rows.map((row) => mapExpense(expenseRowSchema.parse(row)));
  }

  async create(expense: Expense): Promise<void> {
    await this.database.execute(
      `INSERT INTO expenses (
         id, business_id, category, description, amount, spent_at,
         created_at, updated_at, deleted_at, version, device_id
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      expenseValues(expense),
    );
  }

  async update(expense: Expense): Promise<void> {
    await this.database.execute(
      `UPDATE expenses SET
         business_id = ?, category = ?, description = ?, amount = ?, spent_at = ?,
         created_at = ?, updated_at = ?, deleted_at = ?, version = ?, device_id = ?
       WHERE id = ?`,
      [...expenseValues(expense).slice(1), expense.id],
    );
  }

  async delete(expense: Expense): Promise<void> {
    await this.update(expense);
  }
}

function expenseValues(expense: Expense): unknown[] {
  return [
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
  ];
}
