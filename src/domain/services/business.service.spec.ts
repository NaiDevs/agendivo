import { describe, expect, it, vi } from "vitest";

import type { BusinessRepository } from "@/domain/repositories/business.repository";
import { updateFiscalCorrelative } from "@/domain/services/business.service";

describe("updateFiscalCorrelative", () => {
  it("crea la configuración cuando el negocio todavía no tiene correlativo", async () => {
    const repository: BusinessRepository = {
      create: vi.fn(),
      createOnboarding: vi.fn(),
      findActive: vi.fn(),
      findFiscalConfiguration: vi.fn(),
      saveFiscalConfiguration: vi.fn(),
      update: vi.fn(),
    };

    const configuration = await updateFiscalCorrelative(
      null,
      "10000000-0000-4000-8000-000000000001",
      "20000000-0000-4000-8000-000000000001",
      {
        legalName: "Lorraine Nails",
        taxId: "08011999123456",
        establishmentName: "Principal",
        establishmentCode: "001",
        emissionPointName: "Caja principal",
        emissionPointCode: "001",
        cai: "ABC123-DEF456-GHI789-JKL012-MNO345-PQ",
        validUntil: "2027-08-09",
        rangeStart: 1,
        rangeEnd: 100,
        nextNumber: 1,
      },
      repository,
    );

    expect(configuration.authorization?.nextNumber).toBe(1);
    expect(configuration.profile.invoicesEnabled).toBe(true);
    expect(repository.saveFiscalConfiguration).toHaveBeenCalledWith(
      configuration,
    );
  });
});
