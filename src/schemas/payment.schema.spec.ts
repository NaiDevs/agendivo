import { describe, expect, it } from "vitest";

import { paymentFormSchema } from "@/schemas/payment.schema";

const base = {
  customerId: "11111111-1111-4111-8111-111111111111",
  appointmentId: "",
  amount: 150.5,
  method: "cash",
  paidAt: "2026-08-04T10:30",
  notes: "",
};

describe("paymentFormSchema", () => {
  it("acepta un pago válido sin cita", () => {
    const result = paymentFormSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("acepta un pago ligado a una cita", () => {
    const result = paymentFormSchema.safeParse({
      ...base,
      appointmentId: "22222222-2222-4222-8222-222222222222",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza montos que no son positivos", () => {
    const result = paymentFormSchema.safeParse({ ...base, amount: 0 });
    expect(result.success).toBe(false);
  });

  it("rechaza un método desconocido", () => {
    const result = paymentFormSchema.safeParse({ ...base, method: "crypto" });
    expect(result.success).toBe(false);
  });

  it("rechaza un cliente que no es UUID", () => {
    const result = paymentFormSchema.safeParse({ ...base, customerId: "x" });
    expect(result.success).toBe(false);
  });

  it("rechaza una fecha inválida", () => {
    const result = paymentFormSchema.safeParse({ ...base, paidAt: "no-date" });
    expect(result.success).toBe(false);
  });
});
