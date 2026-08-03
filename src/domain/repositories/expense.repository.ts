import type { Expense } from "@/domain/entities/expense";

export interface ExpenseRepository {
  findActiveByBusiness(businessId: string): Promise<Expense[]>;
  create(expense: Expense): Promise<void>;
  update(expense: Expense): Promise<void>;
  delete(expense: Expense): Promise<void>;
}
