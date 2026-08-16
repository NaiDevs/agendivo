import type {
  SyncSnapshot,
  SyncPullResult,
} from "@/domain/entities/sync-snapshot";

export interface CloudSyncRepository {
  ensureBusiness: (businessId: string, businessName: string) => Promise<void>;
  push: (
    businessId: string,
    deviceId: string,
    deviceName: string,
    snapshot: SyncSnapshot,
  ) => Promise<string>;
  pull: (
    businessId: string,
    deviceId: string,
    sinceAt: string | null,
  ) => Promise<SyncPullResult>;
}

export interface LocalSyncSource {
  readSnapshot: (businessId: string) => Promise<SyncSnapshot>;
}

export interface LocalSyncDestination {
  writeSnapshot: (businessId: string, data: SyncPullResult) => Promise<void>;
}
