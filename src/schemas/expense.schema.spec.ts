import { describe, expect, it } from "vitest";

import { expenseFormSchema } from "@/schemas/expense.schema";

const base = {
  category: "supplies",
  description: "Shampoo y toallas",
  amount: 320,
  spentAt: "2026-08-04T10:30",
};

describe("expenseFormSchema", () => {
  it("acepta un gasto válido", () => {
    const result = expenseFormSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("acepta descripción vacía", () => {
    const result = expenseFormSchema.safeParse({ ...base, description: "" });
    expect(result.success).toBe(true);
  });

  it("rechaza montos que no son positivos", () => {
    const result = expenseFormSchema.safeParse({ ...base, amount: 0 });
    expect(result.success).toBe(false);
  });

  it("rechaza una categoría desconocida", () => {
    const result = expenseFormSchema.safeParse({ ...base, category: "fiesta" });
    expect(result.success).toBe(false);
  });

  it("rechaza una fecha inválida", () => {
    const result = expenseFormSchema.safeParse({ ...base, spentAt: "no-date" });
    expect(result.success).toBe(false);
  });
});
