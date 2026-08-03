import {
  EXPENSE_CATEGORY,
  type ExpenseCategory,
} from "@/domain/entities/expense";

export const expenseCategoryLabel: Record<ExpenseCategory, string> = {
  [EXPENSE_CATEGORY.SUPPLIES]: "Insumos",
  [EXPENSE_CATEGORY.RENT]: "Renta",
  [EXPENSE_CATEGORY.UTILITIES]: "Servicios",
  [EXPENSE_CATEGORY.SALARIES]: "Sueldos",
  [EXPENSE_CATEGORY.OTHER]: "Otro",
};
