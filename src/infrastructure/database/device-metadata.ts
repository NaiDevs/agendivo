import type { DatabaseClient } from "@/infrastructure/database/database-client";

interface DeviceMetadataRow {
  key?: string;
  value: string;
}

const LAST_LOCAL_CHANGE_KEY = "last_local_change_at";
const LAST_SYNCED_KEY = "last_synced_at";

function businessMetadataKey(key: string, businessId: string): string {
  return `${key}:${businessId}`;
}

let deviceIdPromise: Promise<string> | null = null;

async function loadOrCreateDeviceId(database: DatabaseClient): Promise<string> {
  const rows = await database.select<DeviceMetadataRow[]>(
    "SELECT value FROM device_metadata WHERE key = ? LIMIT 1",
    ["device_id"],
  );

  const storedDeviceId = rows[0]?.value;
  if (storedDeviceId !== undefined) {
    return storedDeviceId;
  }

  const deviceId = crypto.randomUUID();
  const now = new Date().toISOString();
  await database.execute(
    `INSERT INTO device_metadata (key, value, created_at, updated_at)
     VALUES (?, ?, ?, ?)`,
    ["device_id", deviceId, now, now],
  );

  return deviceId;
}

export function getDeviceId(database: DatabaseClient): Promise<string> {
  deviceIdPromise ??= loadOrCreateDeviceId(database);

  return deviceIdPromise;
}

export async function assertDeviceAccount(
  database: DatabaseClient,
  userId: string,
): Promise<void> {
  const rows = await database.select<DeviceMetadataRow[]>(
    "SELECT value FROM device_metadata WHERE key = ? LIMIT 1",
    ["auth_user_id"],
  );
  const linkedUserId = rows[0]?.value;

  if (linkedUserId !== undefined && linkedUserId !== userId) {
    throw new Error(
      "Este dispositivo está vinculado a otra cuenta. Restaura un respaldo compatible o usa el usuario propietario.",
    );
  }

  if (linkedUserId === undefined) {
    const now = new Date().toISOString();
    await database.execute(
      `INSERT INTO device_metadata (key, value, created_at, updated_at)
       VALUES (?, ?, ?, ?)`,
      ["auth_user_id", userId, now, now],
    );
  }
}

async function saveMetadata(
  database: DatabaseClient,
  key: string,
  value: string,
): Promise<void> {
  const now = new Date().toISOString();
  await database.execute(
    `INSERT INTO device_metadata (key, value, created_at, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET
       value = excluded.value,
       updated_at = excluded.updated_at`,
    [key, value, now, now],
  );
}

export async function markLocalChanges(
  database: DatabaseClient,
  businessId: string,
): Promise<void> {
  await saveMetadata(
    database,
    businessMetadataKey(LAST_LOCAL_CHANGE_KEY, businessId),
    new Date().toISOString(),
  );
}

export async function markSynchronizationCompleted(
  database: DatabaseClient,
  businessId: string,
  syncedAt: string,
): Promise<void> {
  await saveMetadata(
    database,
    businessMetadataKey(LAST_SYNCED_KEY, businessId),
    syncedAt,
  );
}

export async function hasPendingLocalChanges(
  database: DatabaseClient,
  businessId: string,
): Promise<boolean> {
  const lastLocalChangeKey = businessMetadataKey(
    LAST_LOCAL_CHANGE_KEY,
    businessId,
  );
  const lastSyncedKey = businessMetadataKey(LAST_SYNCED_KEY, businessId);
  const rows = await database.select<DeviceMetadataRow[]>(
    "SELECT key, value FROM device_metadata WHERE key IN (?, ?)",
    [lastLocalChangeKey, lastSyncedKey],
  );
  const metadata = new Map(rows.map((row) => [row.key, row.value]));
  const lastLocalChange = metadata.get(lastLocalChangeKey);
  const lastSynced = metadata.get(lastSyncedKey);

  return (
    lastLocalChange !== undefined &&
    (lastSynced === undefined || lastLocalChange > lastSynced)
  );
}

export async function getLastSyncedAt(
  database: DatabaseClient,
  businessId: string,
): Promise<string | null> {
  const rows = await database.select<DeviceMetadataRow[]>(
    "SELECT value FROM device_metadata WHERE key = ? LIMIT 1",
    [businessMetadataKey(LAST_SYNCED_KEY, businessId)],
  );

  return rows[0]?.value ?? null;
}
