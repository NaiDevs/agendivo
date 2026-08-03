import { describe, expect, it } from "vitest";

import { customerFormSchema } from "@/schemas/customer.schema";

describe("customerFormSchema", () => {
  it("acepta datos mínimos y limpia espacios", () => {
    const result = customerFormSchema.parse({
      name: "  Ana López  ",
      phone: "",
      email: "",
      notes: "",
    });

    expect(result.name).toBe("Ana López");
  });

  it("rechaza nombres vacíos", () => {
    const result = customerFormSchema.safeParse({
      name: "   ",
      phone: "",
      email: "",
      notes: "",
    });

    expect(result.success).toBe(false);
  });
});
