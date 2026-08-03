import { describe, expect, it } from "vitest";

import { businessFormSchema } from "@/schemas/business.schema";

describe("businessFormSchema", () => {
  it("normaliza nombre y moneda", () => {
    const result = businessFormSchema.parse({
      name: "  Barbería Central  ",
      phone: "",
      email: "",
      address: "",
      timezone: "America/Guatemala",
      currency: "gtq",
    });

    expect(result.name).toBe("Barbería Central");
    expect(result.currency).toBe("GTQ");
  });

  it("rechaza un correo inválido", () => {
    const result = businessFormSchema.safeParse({
      name: "Barbería Central",
      phone: "",
      email: "correo-invalido",
      address: "",
      timezone: "America/Guatemala",
      currency: "GTQ",
    });

    expect(result.success).toBe(false);
  });
});
