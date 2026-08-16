import type { Business } from "@/domain/entities/business";
import type {
  CloudSyncRepository,
  LocalSyncSource,
} from "@/domain/repositories/cloud-sync.repository";

export async function synchronizeBusiness(
  business: Business,
  deviceId: string,
  deviceName: string,
  localSource: LocalSyncSource,
  cloudRepository: CloudSyncRepository,
): Promise<string> {
  await cloudRepository.ensureBusiness(business.id, business.name);
  const snapshot = await localSource.readSnapshot(business.id);
  return cloudRepository.push(business.id, deviceId, deviceName, snapshot);
}
