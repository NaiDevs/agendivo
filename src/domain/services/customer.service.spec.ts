import { describe, expect, it, vi } from "vitest";

import {
  CUSTOMER_CUSTOM_FIELD_TYPE,
  type CustomerCustomField,
} from "@/domain/entities/customer-custom-field";
import type { CustomerRepository } from "@/domain/repositories/customer.repository";
import { createCustomer } from "@/domain/services/customer.service";

const FIELD_ID = "55555555-5555-4555-8555-555555555555";

function field(
  overrides: Partial<CustomerCustomField> = {},
): CustomerCustomField {
  return {
    id: FIELD_ID,
    businessId: "11111111-1111-4111-8111-111111111111",
    name: "Sede preferida",
    type: CUSTOMER_CUSTOM_FIELD_TYPE.SELECT,
    isRequired: true,
    isMultiple: false,
    options: ["Centro", "Norte"],
    sortOrder: 0,
    createdAt: "2026-08-16T00:00:00.000Z",
    updatedAt: "2026-08-16T00:00:00.000Z",
    deletedAt: null,
    version: 1,
    deviceId: "22222222-2222-4222-8222-222222222222",
    ...overrides,
  };
}

function repository(): CustomerRepository {
  return {
    findActiveByBusiness: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
  };
}

describe("createCustomer con campos personalizados", () => {
  it("persiste un valor válido definido por el negocio", async () => {
    const result = await createCustomer(
      {
        name: "Ana López",
        phone: "",
        email: "",
        notes: "",
        customFieldValues: { [FIELD_ID]: "Centro" },
      },
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222",
      repository(),
      [field()],
    );

    expect(result.customFieldValues).toEqual({ [FIELD_ID]: "Centro" });
  });

  it("rechaza una opción que no pertenece a la definición", async () => {
    await expect(
      createCustomer(
        {
          name: "Ana López",
          phone: "",
          email: "",
          notes: "",
          customFieldValues: { [FIELD_ID]: "Sur" },
        },
        "11111111-1111-4111-8111-111111111111",
        "22222222-2222-4222-8222-222222222222",
        repository(),
        [field()],
      ),
    ).rejects.toThrow("Sede preferida tiene un valor inválido");
  });

  it("exige los campos marcados como obligatorios", async () => {
    await expect(
      createCustomer(
        {
          name: "Ana López",
          phone: "",
          email: "",
          notes: "",
          customFieldValues: {},
        },
        "11111111-1111-4111-8111-111111111111",
        "22222222-2222-4222-8222-222222222222",
        repository(),
        [field()],
      ),
    ).rejects.toThrow("Sede preferida es obligatorio");
  });
});
