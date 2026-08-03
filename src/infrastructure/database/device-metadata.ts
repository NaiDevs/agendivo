import type { DatabaseClient } from "@/infrastructure/database/database-client";

interface DeviceMetadataRow {
  value: string;
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
