import { describe, expect, it } from "vitest";

import { employeeFormSchema } from "@/schemas/employee.schema";

describe("employeeFormSchema", () => {
  it("acepta un profesional con contacto opcional", () => {
    const result = employeeFormSchema.safeParse({
      name: "Ana López",
      phone: "",
      email: "",
    });
    expect(result.success).toBe(true);
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
