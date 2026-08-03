import Database from "@tauri-apps/plugin-sql";

import type { DatabaseClient } from "@/infrastructure/database/database-client";

const DATABASE_URL = "sqlite:nai-citas.db";

let databasePromise: Promise<Database> | null = null;

export function getDatabase(): Promise<Database> {
  databasePromise ??= Database.load(DATABASE_URL);

  return databasePromise;
}

export async function initializeDatabase(): Promise<void> {
  await getDatabase();
}

export async function getDatabaseClient(): Promise<DatabaseClient> {
  return getDatabase();
}
