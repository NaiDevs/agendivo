import type { SyncSnapshot } from "@/domain/entities/sync-snapshot";

export interface CloudSyncRepository {
  ensureBusiness: (businessId: string, businessName: string) => Promise<void>;
  push: (
    businessId: string,
    deviceId: string,
    deviceName: string,
    snapshot: SyncSnapshot,
  ) => Promise<string>;
}

export interface LocalSyncSource {
  readSnapshot: (businessId: string) => Promise<SyncSnapshot>;
}
