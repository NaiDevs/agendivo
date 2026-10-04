import { describe, expect, it } from "vitest";

import { CUSTOMER_CUSTOM_FIELD_TYPE } from "@/domain/entities/customer-custom-field";
import { customerCustomFieldFormSchema } from "@/schemas/customer-custom-field.schema";

describe("customerCustomFieldFormSchema", () => {
  it("acepta una lista con opciones únicas", () => {
    const result = customerCustomFieldFormSchema.parse({
      name: "  Sede preferida  ",
      type: CUSTOMER_CUSTOM_FIELD_TYPE.SELECT,
      isRequired: true,
      isMultiple: false,
      options: ["Centro", "Norte"],
    });

    expect(result.name).toBe("Sede preferida");
    expect(result.options).toEqual(["Centro", "Norte"]);
  });

  it("rechaza opciones repetidas ignorando mayúsculas", () => {
    const result = customerCustomFieldFormSchema.safeParse({
      name: "Preferencia",
      type: CUSTOMER_CUSTOM_FIELD_TYPE.SELECT,
      isRequired: false,
      isMultiple: true,
      options: ["Primera", "primera"],
    });

    expect(result.success).toBe(false);
  });

  it("limpia opciones para campos que no son listas", () => {
    const result = customerCustomFieldFormSchema.parse({
      name: "Alergias",
      type: CUSTOMER_CUSTOM_FIELD_TYPE.TEXT,
      isRequired: false,
      isMultiple: false,
      options: ["No aplica"],
    });

    expect(result.options).toEqual([]);
  });
});
