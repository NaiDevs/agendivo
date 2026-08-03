import type { SyncableEntity } from "@/domain/entities/syncable-entity";

export const EXPENSE_CATEGORY = {
  SUPPLIES: "supplies",
  RENT: "rent",
  UTILITIES: "utilities",
  SALARIES: "salaries",
  OTHER: "other",
} as const;

export type ExpenseCategory =
  (typeof EXPENSE_CATEGORY)[keyof typeof EXPENSE_CATEGORY];

export interface Expense extends SyncableEntity {
  businessId: string;
  category: ExpenseCategory;
  description: string | null;
  amount: number;
  spentAt: string;
}
