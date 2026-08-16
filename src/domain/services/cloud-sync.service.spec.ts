import { describe, expect, it, vi } from "vitest";

import type { Business } from "@/domain/entities/business";
import type { SyncSnapshot } from "@/domain/entities/sync-snapshot";
import type {
  CloudSyncRepository,
  LocalSyncSource,
} from "@/domain/repositories/cloud-sync.repository";
import { synchronizeBusiness } from "@/domain/services/cloud-sync.service";

const business: Business = {
  id: "10000000-0000-4000-8000-000000000001",
  name: "Agendivo Demo",
  phone: null,
  email: null,
  address: null,
  timezone: "America/Tegucigalpa",
  currency: "HNL",
  createdAt: "2026-08-03T10:00:00.000Z",
  updatedAt: "2026-08-03T10:00:00.000Z",
  deletedAt: null,
  version: 1,
  deviceId: "20000000-0000-4000-8000-000000000001",
};

const snapshot: SyncSnapshot = {
  business: {
    id: business.id,
    name: business.name,
    phone: null,
    email: null,
    address: null,
    timezone: business.timezone,
    currency: business.currency,
    created_at: business.createdAt,
    updated_at: business.updatedAt,
    deleted_at: null,
    version: 1,
    device_id: business.deviceId,
  },
  customers: [],
  emissionPoints: [],
  employees: [],
  fiscalAuthorizations: [],
  fiscalProfiles: [],
  services: [],
  appointments: [],
};

describe("synchronizeBusiness", () => {
  it("crea el tenant antes de enviar la instantánea local", async () => {
    const calls: string[] = [];
    const localSource: LocalSyncSource = {
      readSnapshot: vi.fn(async (): Promise<SyncSnapshot> => {
        calls.push("snapshot");
        return snapshot;
      }),
    };
    const cloudRepository: CloudSyncRepository = {
      ensureBusiness: vi.fn(async (): Promise<void> => {
        calls.push("business");
      }),
      push: vi.fn(async (): Promise<string> => {
        calls.push("push");
        return "2026-08-03T10:01:00.000Z";
      }),
    };

    const result = await synchronizeBusiness(
      business,
      business.deviceId,
      "Equipo de prueba",
      localSource,
      cloudRepository,
    );

    expect(result).toBe("2026-08-03T10:01:00.000Z");
    expect(calls).toEqual(["business", "snapshot", "push"]);
    expect(cloudRepository.ensureBusiness).toHaveBeenCalledWith(
      business.id,
      business.name,
    );
    expect(cloudRepository.push).toHaveBeenCalledWith(
      business.id,
      business.deviceId,
      "Equipo de prueba",
      snapshot,
    );
  });
});
