import { describe, expect, it } from "vitest";

import { employeeFormSchema } from "@/schemas/employee.schema";

describe("employeeFormSchema", () => {
  it("acepta un profesional con correo para su invitación", () => {
    const result = employeeFormSchema.safeParse({
      name: "Ana López",
      phone: "",
      email: "ana@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("requiere correo para crear la cuenta", () => {
    const result = employeeFormSchema.safeParse({
      name: "Ana López",
      phone: "",
      email: "",
    });
    expect(result.success).toBe(false);
  });

  it("rechaza un correo inválido", () => {
    const result = employeeFormSchema.safeParse({
      name: "Ana López",
      phone: "",
      email: "correo-invalido",
    });
    expect(result.success).toBe(false);
  });
});
