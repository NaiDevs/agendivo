import Database from "@tauri-apps/plugin-sql";

import type { DatabaseClient } from "@/infrastructure/database/database-client";

export const DATABASE_FILE_NAME = "agendivo.db";
export const DATABASE_URL = `sqlite:${DATABASE_FILE_NAME}`;

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

export async function closeDatabase(): Promise<void> {
  const activeDatabase = databasePromise;
  databasePromise = null;

  if (activeDatabase === null) {
    return;
  }

  const database = await activeDatabase;
  await database.close(DATABASE_URL);
}
