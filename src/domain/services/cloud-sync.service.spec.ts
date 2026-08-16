import { describe, it, expect, vi } from "vitest";
import { synchronizeBusiness } from "./cloud-sync.service";
import type { Business } from "@/domain/entities/business";
import type {
  CloudSyncRepository,
  LocalSyncSource,
  LocalSyncDestination,
} from "@/domain/repositories/cloud-sync.repository";
import type {
  SyncSnapshot,
  SyncPullResult,
} from "@/domain/entities/sync-snapshot";

const BUSINESS: Business = {
  id: "biz-001",
  name: "Barbería Central",
  phone: null,
  email: null,
  address: null,
  timezone: "America/Tegucigalpa",
  currency: "HNL",
  createdAt: "2026-08-01T00:00:00Z",
  updatedAt: "2026-08-01T00:00:00Z",
  deletedAt: null,
  version: 1,
  deviceId: "dev-001",
};

const EMPTY_SNAPSHOT: SyncSnapshot = {
  business: {
    id: BUSINESS.id,
    name: BUSINESS.name,
    phone: null,
    email: null,
    address: null,
    timezone: BUSINESS.timezone,
    currency: BUSINESS.currency,
    created_at: BUSINESS.createdAt,
    updated_at: BUSINESS.updatedAt,
    deleted_at: null,
    version: 1,
    device_id: "dev-001",
  },
  customers: [],
  employees: [],
  services: [],
  appointments: [],
  fiscalProfiles: [],
  emissionPoints: [],
  fiscalAuthorizations: [],
};

const PULL_RESULT: SyncPullResult = {
  customers: [
    {
      id: "cust-999",
      business_id: BUSINESS.id,
      name: "Cliente Remoto",
      phone: null,
      email: null,
      notes: null,
      created_at: "2026-08-10T00:00:00Z",
      updated_at: "2026-08-10T00:00:00Z",
      deleted_at: null,
      version: 1,
      device_id: "dev-002",
    },
  ],
  employees: [],
  services: [],
  appointments: [],
};

function makeCloudRepo(
  overrides?: Partial<CloudSyncRepository>,
): CloudSyncRepository {
  return {
    ensureBusiness: vi.fn().mockResolvedValue(undefined),
    push: vi.fn().mockResolvedValue("2026-08-15T10:00:00Z"),
    pull: vi.fn().mockResolvedValue(PULL_RESULT),
    ...overrides,
  };
}

function makeLocalSource(): LocalSyncSource {
  return {
    readSnapshot: vi.fn().mockResolvedValue(EMPTY_SNAPSHOT),
  };
}

function makeLocalDestination(): LocalSyncDestination {
  return {
    writeSnapshot: vi.fn().mockResolvedValue(undefined),
  };
}

describe("synchronizeBusiness", () => {
  it("empuja datos locales y luego descarga los remotos", async () => {
    const cloud = makeCloudRepo();
    const source = makeLocalSource();
    const destination = makeLocalDestination();

    const result = await synchronizeBusiness(
      BUSINESS,
      "dev-001",
      "Mi Equipo",
      null,
      source,
      destination,
      cloud,
    );

    expect(cloud.ensureBusiness).toHaveBeenCalledWith(
      BUSINESS.id,
      BUSINESS.name,
    );
    expect(cloud.push).toHaveBeenCalledOnce();
    expect(cloud.pull).toHaveBeenCalledWith(BUSINESS.id, "dev-001", null);
    expect(destination.writeSnapshot).toHaveBeenCalledWith(
      BUSINESS.id,
      PULL_RESULT,
    );
    expect(result.syncedAt).toBe("2026-08-15T10:00:00Z");
    expect(result.pulled).toBe(1);
  });

  it("pasa lastSyncedAt al pull cuando se provee", async () => {
    const cloud = makeCloudRepo();
    const source = makeLocalSource();
    const destination = makeLocalDestination();

    await synchronizeBusiness(
      BUSINESS,
      "dev-001",
      "Mi Equipo",
      "2026-08-10T00:00:00Z",
      source,
      destination,
      cloud,
    );

    expect(cloud.pull).toHaveBeenCalledWith(
      BUSINESS.id,
      "dev-001",
      "2026-08-10T00:00:00Z",
    );
  });

  it("no llama writeSnapshot si pull no devuelve registros", async () => {
    const emptyPull: SyncPullResult = {
      customers: [],
      employees: [],
      services: [],
      appointments: [],
    };
    const cloud = makeCloudRepo({ pull: vi.fn().mockResolvedValue(emptyPull) });
    const source = makeLocalSource();
    const destination = makeLocalDestination();

    const result = await synchronizeBusiness(
      BUSINESS,
      "dev-001",
      "Mi Equipo",
      "2026-08-15T00:00:00Z",
      source,
      destination,
      cloud,
    );

    expect(destination.writeSnapshot).not.toHaveBeenCalled();
    expect(result.pulled).toBe(0);
  });
});
