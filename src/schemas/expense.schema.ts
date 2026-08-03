import { z } from "zod";

import { EXPENSE_CATEGORY } from "@/domain/entities/expense";

export const expenseFormSchema = z.object({
  category: z.enum([
    EXPENSE_CATEGORY.SUPPLIES,
    EXPENSE_CATEGORY.RENT,
    EXPENSE_CATEGORY.UTILITIES,
    EXPENSE_CATEGORY.SALARIES,
    EXPENSE_CATEGORY.OTHER,
  ]),
  description: z.string().trim().max(500),
  amount: z
    .number()
    .positive("El monto debe ser mayor que cero.")
    .max(1_000_000),
  spentAt: z
    .string()
    .min(1, "Selecciona fecha y hora.")
    .refine(
      (value) => !Number.isNaN(new Date(value).getTime()),
      "Selecciona una fecha válida.",
    ),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
