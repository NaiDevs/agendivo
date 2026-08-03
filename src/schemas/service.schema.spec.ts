import { describe, expect, it } from "vitest";

import { serviceFormSchema } from "@/schemas/service.schema";

describe("serviceFormSchema", () => {
  it("acepta duración y precio válidos", () => {
    const result = serviceFormSchema.safeParse({
      name: "Corte clásico",
      description: "",
      durationMinutes: 30,
      price: 75.5,
    });
    expect(result.success).toBe(true);
  });

  it("rechaza duraciones menores a cinco minutos", () => {
    const result = serviceFormSchema.safeParse({
      name: "Corte clásico",
      description: "",
      durationMinutes: 4,
      price: 75,
    });
    expect(result.success).toBe(false);
  });

  it("rechaza precios negativos", () => {
    const result = serviceFormSchema.safeParse({
      name: "Corte clásico",
      description: "",
      durationMinutes: 30,
      price: -1,
    });
    expect(result.success).toBe(false);
  });
});
