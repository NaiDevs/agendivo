import { describe, expect, it } from "vitest";

import { EXPENSE_CATEGORY, type Expense } from "@/domain/entities/expense";
import type { ExpenseRepository } from "@/domain/repositories/expense.repository";
import {
  createExpense,
  deleteExpense,
  updateExpense,
} from "@/domain/services/expense.service";

class FakeExpenseRepository implements ExpenseRepository {
  created: Expense | null = null;
  updated: Expense | null = null;
  deleted: Expense | null = null;

  async findActiveByBusiness(): Promise<Expense[]> {
    return [];
  }
  async create(expense: Expense): Promise<void> {
    this.created = expense;
  }
  async update(expense: Expense): Promise<void> {
    this.updated = expense;
  }
  async delete(expense: Expense): Promise<void> {
    this.deleted = expense;
  }
}

const businessId = "44444444-4444-4444-8444-444444444444";
const deviceId = "55555555-5555-4555-8555-555555555555";

const values = {
  category: EXPENSE_CATEGORY.SUPPLIES,
  description: "Shampoo",
  amount: 320.5,
  spentAt: "2026-08-04T10:30",
};

function makeExpense(): Expense {
  return {
    id: "66666666-6666-4666-8666-666666666666",
    businessId,
    category: EXPENSE_CATEGORY.RENT,
    description: null,
    amount: 500000,
    spentAt: "2026-08-01T00:00:00.000Z",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    deletedAt: null,
    version: 1,
    deviceId,
  };
}

describe("createExpense", () => {
  it("convierte el monto a centavos y guarda una fecha UTC", async () => {
    const repository = new FakeExpenseRepository();
    const expense = await createExpense(
      values,
      businessId,
      deviceId,
      repository,
    );

    expect(expense.amount).toBe(32050);
    expect(expense.spentAt.endsWith("Z")).toBe(true);
    expect(expense.version).toBe(1);
    expect(repository.created).toEqual(expense);
  });
});

describe("updateExpense", () => {
  it("aplica los cambios e incrementa la versión", async () => {
    const repository = new FakeExpenseRepository();
    const current = makeExpense();

    const expense = await updateExpense(
      current,
      { ...values, amount: 12 },
      repository,
    );

    expect(expense.amount).toBe(1200);
    expect(expense.category).toBe(EXPENSE_CATEGORY.SUPPLIES);
    expect(expense.version).toBe(current.version + 1);
    expect(repository.updated).toEqual(expense);
  });
});

describe("deleteExpense", () => {
  it("marca la fecha de borrado e incrementa la versión", async () => {
    const repository = new FakeExpenseRepository();
    const current = makeExpense();

    const expense = await deleteExpense(current, repository);

    expect(expense.deletedAt).not.toBeNull();
    expect(expense.version).toBe(current.version + 1);
    expect(repository.deleted).toEqual(expense);
  });
});
