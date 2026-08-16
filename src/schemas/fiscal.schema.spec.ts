import { describe, expect, it } from "vitest";

import { businessOnboardingSchema } from "@/schemas/fiscal.schema";

const validInput = {
  name: "Agendivo Demo",
  phone: "9999-9999",
  email: "negocio@ejemplo.com",
  address: "Tegucigalpa",
  timezone: "America/Tegucigalpa",
  currency: "HNL",
  countryCode: "HN",
  legalName: "Agendivo Demo S. de R.L.",
  taxId: "08011999123456",
  invoicesEnabled: true,
  establishmentName: "Principal",
  establishmentCode: "001",
  emissionPointName: "Caja principal",
  emissionPointCode: "001",
  cai: "ABC123-DEF456-GHI789-JKL012-MNO345-PQ",
  validUntil: "2027-08-09",
  rangeStart: 1,
  rangeEnd: 100,
  nextNumber: 1,
};

describe("businessOnboardingSchema", () => {
  it("acepta una configuración fiscal completa", () => {
    expect(businessOnboardingSchema.safeParse(validInput).success).toBe(true);
  });

  it("permite dejar la facturación fiscal pendiente", () => {
    const result = businessOnboardingSchema.safeParse({
      ...validInput,
      invoicesEnabled: false,
      taxId: "",
      cai: "",
      validUntil: "",
      establishmentCode: "",
      emissionPointCode: "",
    });

    expect(result.success).toBe(true);
  });

  it("rechaza un próximo correlativo fuera del rango autorizado", () => {
    const result = businessOnboardingSchema.safeParse({
      ...validInput,
      nextNumber: 101,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({ path: ["nextNumber"] }),
      );
    }
  });
});
