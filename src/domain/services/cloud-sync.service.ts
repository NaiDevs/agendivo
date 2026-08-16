import type { Business } from "@/domain/entities/business";
import type { SyncPullResult } from "@/domain/entities/sync-snapshot";
import type {
  CloudSyncRepository,
  LocalSyncSource,
  LocalSyncDestination,
} from "@/domain/repositories/cloud-sync.repository";

function countPulled(data: SyncPullResult): number {
  return (
    data.customers.length +
    data.employees.length +
    data.services.length +
    data.appointments.length
  );
}

export async function synchronizeBusiness(
  business: Business,
  deviceId: string,
  deviceName: string,
  lastSyncedAt: string | null,
  localSource: LocalSyncSource,
  localDestination: LocalSyncDestination,
  cloudRepository: CloudSyncRepository,
): Promise<{ syncedAt: string; pulled: number }> {
  await cloudRepository.ensureBusiness(business.id, business.name);
  const snapshot = await localSource.readSnapshot(business.id);
  const syncedAt = await cloudRepository.push(
    business.id,
    deviceId,
    deviceName,
    snapshot,
  );
  const pullResult = await cloudRepository.pull(
    business.id,
    deviceId,
    lastSyncedAt,
  );
  const pulled = countPulled(pullResult);
  if (pulled > 0) {
    await localDestination.writeSnapshot(business.id, pullResult);
  }
  return { syncedAt, pulled };
}
