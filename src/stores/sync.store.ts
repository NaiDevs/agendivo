import { create } from "zustand";

import type { Business } from "@/domain/entities/business";
import { synchronizeBusiness } from "@/domain/services/cloud-sync.service";
import { getDatabaseClient } from "@/infrastructure/database/connection";
import {
  getDeviceId,
  getLastSyncedAt,
  hasPendingLocalChanges,
  markLocalChanges,
  markSynchronizationCompleted,
} from "@/infrastructure/database/device-metadata";
import {
  SqliteSyncSource,
  SqliteSyncDestination,
} from "@/infrastructure/sync/sqlite-sync.source";
import { SupabaseCloudSyncRepository } from "@/infrastructure/sync/supabase-cloud-sync.repository";
import { isSupabaseConfigured } from "@/infrastructure/supabase/client";

export const SYNC_STATUS = {
  ERROR: "error",
  IDLE: "idle",
  SYNCED: "synced",
  SYNCING: "syncing",
  UNAVAILABLE: "unavailable",
} as const;

type SyncStatus = (typeof SYNC_STATUS)[keyof typeof SYNC_STATUS];

export function shouldOpenPendingPrompt(
  hasPendingChanges: boolean,
  isOnline: boolean,
  status: SyncStatus,
): boolean {
  return (
    hasPendingChanges &&
    isOnline &&
    status !== SYNC_STATUS.SYNCING &&
    status !== SYNC_STATUS.SYNCED
  );
}

interface SyncStore {
  error: string | null;
  hasPendingChanges: boolean;
  isPendingStateLoaded: boolean;
  isPromptOpen: boolean;
  lastSyncedAt: string | null;
  lastPulled: number;
  dismissPendingPrompt: () => void;
  loadPendingChanges: (businessId: string) => Promise<void>;
  markPendingChanges: (businessId: string) => Promise<void>;
  openPendingPrompt: () => void;
  status: SyncStatus;
  syncNow: (business: Business) => Promise<boolean>;
}

function syncErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }
  return "No fue posible sincronizar con la nube.";
}

export const useSyncStore = create<SyncStore>((set, get) => ({
  error: null,
  hasPendingChanges: false,
  isPendingStateLoaded: false,
  isPromptOpen: false,
  lastSyncedAt: null,
  lastPulled: 0,
  status: isSupabaseConfigured() ? SYNC_STATUS.IDLE : SYNC_STATUS.UNAVAILABLE,

  dismissPendingPrompt: (): void => set({ isPromptOpen: false }),

  loadPendingChanges: async (businessId: string): Promise<void> => {
    const database = await getDatabaseClient();
    const [hasPendingChanges, lastSyncedAt] = await Promise.all([
      hasPendingLocalChanges(database, businessId),
      getLastSyncedAt(database, businessId),
    ]);
    set((state) => ({
      hasPendingChanges,
      isPendingStateLoaded: true,
      isPromptOpen: shouldOpenPendingPrompt(
        hasPendingChanges,
        navigator.onLine,
        state.status,
      ),
      lastSyncedAt,
    }));
  },

  markPendingChanges: async (businessId: string): Promise<void> => {
    const database = await getDatabaseClient();
    await markLocalChanges(database, businessId);
    set({
      error: null,
      hasPendingChanges: true,
      status: isSupabaseConfigured()
        ? SYNC_STATUS.IDLE
        : SYNC_STATUS.UNAVAILABLE,
    });
  },

  openPendingPrompt: (): void => {
    if (get().hasPendingChanges) set({ isPromptOpen: true });
  },

  syncNow: async (business: Business): Promise<boolean> => {
    if (!isSupabaseConfigured()) {
      set({ status: SYNC_STATUS.UNAVAILABLE });
      return false;
    }
    if (get().status === SYNC_STATUS.SYNCING) {
      return false;
    }

    set({ error: null, status: SYNC_STATUS.SYNCING });
    try {
      const database = await getDatabaseClient();
      const deviceId = await getDeviceId(database);
      const lastSyncedAt = await getLastSyncedAt(database, business.id);
      const { syncedAt, pulled } = await synchronizeBusiness(
        business,
        deviceId,
        "Agendivo Desktop",
        lastSyncedAt,
        new SqliteSyncSource(database),
        new SqliteSyncDestination(database),
        new SupabaseCloudSyncRepository(),
      );
      await markSynchronizationCompleted(database, business.id, syncedAt);
      set({
        hasPendingChanges: false,
        isPromptOpen: false,
        lastSyncedAt: syncedAt,
        lastPulled: pulled,
        status: SYNC_STATUS.SYNCED,
      });
      if (pulled > 0 && typeof window !== "undefined") {
        window.dispatchEvent(new Event("agendivo:sync-pulled"));
      }
      return true;
    } catch (error: unknown) {
      set({ error: syncErrorMessage(error), status: SYNC_STATUS.ERROR });
      return false;
    }
  },
}));
