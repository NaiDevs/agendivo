import Database from "@tauri-apps/plugin-sql";
import { appConfigDir, join } from "@tauri-apps/api/path";
import { open as openDialog, save } from "@tauri-apps/plugin-dialog";
import {
  copyFile,
  exists,
  open as openFile,
  remove,
} from "@tauri-apps/plugin-fs";

import {
  closeDatabase,
  DATABASE_FILE_NAME,
  getDatabase,
} from "@/infrastructure/database/connection";

export const BACKUP_RESULT = {
  SAVED: "saved",
  CANCELLED: "cancelled",
} as const;

export type BackupResultStatus =
  (typeof BACKUP_RESULT)[keyof typeof BACKUP_RESULT];

export interface BackupResult {
  status: BackupResultStatus;
  path?: string;
}

export interface BackupCounts {
  appointments: number;
  customers: number;
  employees: number;
  expenses: number;
  payments: number;
  services: number;
}

export interface BackupSummary {
  businessName: string | null;
  counts: BackupCounts;
}

export interface RestoreCandidate {
  sourcePath: string;
  summary: BackupSummary;
}

interface IntegrityRow {
  integrity_check: string;
}

interface TableRow {
  name: string;
}

interface BusinessRow {
  name: string;
}

interface CountRow {
  appointments: number;
  customers: number;
  employees: number;
  expenses: number;
  payments: number;
  services: number;
}

const REQUIRED_TABLES = [
  "appointments",
  "businesses",
  "customers",
  "device_metadata",
  "employees",
  "expenses",
  "payments",
  "services",
] as const;

const SQLITE_HEADER = "SQLite format 3\u0000";
const SQLITE_HEADER_LENGTH = 16;

export function createBackupFileName(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((item) => item.type === type)?.value ?? "00";

  return `nai-citas-${part("year")}-${part("month")}-${part("day")}_${part("hour")}-${part("minute")}.sqlite`;
}

export function isSqliteHeader(bytes: Uint8Array): boolean {
  if (bytes.byteLength < SQLITE_HEADER_LENGTH) {
    return false;
  }
  return new TextDecoder()
    .decode(bytes.subarray(0, SQLITE_HEADER_LENGTH))
    .startsWith(SQLITE_HEADER);
}

export function getMissingRequiredTables(tableNames: string[]): string[] {
  const availableTables = new Set(tableNames);
  return REQUIRED_TABLES.filter((table) => !availableTables.has(table));
}

export async function createDatabaseBackup(): Promise<BackupResult> {
  const destination = await save({
    defaultPath: createBackupFileName(),
    filters: [{ name: "Respaldo de Nai Citas", extensions: ["sqlite", "db"] }],
    title: "Guardar respaldo de Nai Citas",
  });

  if (destination === null) {
    return { status: BACKUP_RESULT.CANCELLED };
  }
  const databasePath = await getMainDatabasePath();
  if (normalizePath(destination) === normalizePath(databasePath)) {
    throw new Error(
      "El respaldo debe guardarse fuera del archivo de datos activo.",
    );
  }

  const temporary = await createTemporaryDatabasePath("backup");
  await removeIfExists(temporary.path);

  try {
    const database = await getDatabase();
    await database.execute("VACUUM INTO $1", [temporary.path]);
    await copyFile(temporary.path, destination);
    return { status: BACKUP_RESULT.SAVED, path: destination };
  } finally {
    await removeIfExists(temporary.path);
  }
}

export async function selectRestoreCandidate(): Promise<RestoreCandidate | null> {
  const sourcePath = await openDialog({
    filters: [{ name: "Respaldo de Nai Citas", extensions: ["sqlite", "db"] }],
    multiple: false,
    title: "Seleccionar respaldo de Nai Citas",
  });

  if (sourcePath === null) {
    return null;
  }

  const databasePath = await getMainDatabasePath();
  if (normalizePath(sourcePath) === normalizePath(databasePath)) {
    throw new Error("Selecciona una copia de respaldo, no la base activa.");
  }

  const summary = await inspectBackup(sourcePath);
  return { sourcePath, summary };
}

export async function restoreDatabaseBackup(
  candidate: RestoreCandidate,
): Promise<BackupSummary> {
  const verifiedSummary = await inspectBackup(candidate.sourcePath);
  const rollback = await createTemporaryDatabasePath("before-restore");
  const mainDatabasePath = await getMainDatabasePath();
  const database = await getDatabase();

  await removeIfExists(rollback.path);
  await database.execute("VACUUM INTO $1", [rollback.path]);
  let replacementStarted = false;

  try {
    await closeDatabase();
    await removeDatabaseSidecars(mainDatabasePath);
    replacementStarted = true;
    await copyFile(candidate.sourcePath, mainDatabasePath);

    const restoredDatabase = await getDatabase();
    await validateDatabase(restoredDatabase);
    return verifiedSummary;
  } catch (error: unknown) {
    if (replacementStarted) {
      await closeDatabaseSafely();
      await removeDatabaseSidecars(mainDatabasePath);
      await copyFile(rollback.path, mainDatabasePath);
    }
    await getDatabase();
    throw error;
  } finally {
    await removeIfExists(rollback.path);
  }
}

async function inspectBackup(sourcePath: string): Promise<BackupSummary> {
  await validateSqliteHeader(sourcePath);
  const candidate = await createTemporaryDatabasePath("restore-candidate");
  await removeIfExists(candidate.path);

  try {
    await copyFile(sourcePath, candidate.path);
    const database = await Database.load(candidate.url);
    try {
      return await validateDatabase(database);
    } finally {
      await database.close(candidate.url);
    }
  } finally {
    await removeIfExists(candidate.path);
  }
}

async function validateDatabase(database: Database): Promise<BackupSummary> {
  const integrity = await database.select<IntegrityRow[]>(
    "PRAGMA integrity_check",
  );
  if (integrity.length !== 1 || integrity[0]?.integrity_check !== "ok") {
    throw new Error("El archivo está dañado y no puede restaurarse.");
  }

  const tables = await database.select<TableRow[]>(
    "SELECT name FROM sqlite_master WHERE type = 'table'",
  );
  const missingTables = getMissingRequiredTables(
    tables.map((table) => table.name),
  );
  if (missingTables.length > 0) {
    throw new Error(
      "El respaldo no pertenece a una versión compatible de Nai Citas.",
    );
  }

  const businesses = await database.select<BusinessRow[]>(
    "SELECT name FROM businesses WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1",
  );
  const counts = await database.select<CountRow[]>(`
    SELECT
      (SELECT COUNT(*) FROM appointments WHERE deleted_at IS NULL) AS appointments,
      (SELECT COUNT(*) FROM customers WHERE deleted_at IS NULL) AS customers,
      (SELECT COUNT(*) FROM employees WHERE deleted_at IS NULL) AS employees,
      (SELECT COUNT(*) FROM expenses WHERE deleted_at IS NULL) AS expenses,
      (SELECT COUNT(*) FROM payments WHERE deleted_at IS NULL) AS payments,
      (SELECT COUNT(*) FROM services WHERE deleted_at IS NULL) AS services
  `);
  const row = counts[0];
  if (row === undefined) {
    throw new Error("No pudimos leer el contenido del respaldo.");
  }

  return {
    businessName: businesses[0]?.name ?? null,
    counts: row,
  };
}

async function validateSqliteHeader(path: string): Promise<void> {
  const file = await openFile(path, { read: true });
  try {
    const header = new Uint8Array(SQLITE_HEADER_LENGTH);
    await file.read(header);
    if (!isSqliteHeader(header)) {
      throw new Error("El archivo seleccionado no es una base SQLite válida.");
    }
  } finally {
    await file.close();
  }
}

async function createTemporaryDatabasePath(label: string): Promise<{
  path: string;
  url: string;
}> {
  const fileName = `nai-citas-${label}-${crypto.randomUUID()}.db`;
  return {
    path: await join(await appConfigDir(), fileName),
    url: `sqlite:${fileName}`,
  };
}

async function getMainDatabasePath(): Promise<string> {
  return join(await appConfigDir(), DATABASE_FILE_NAME);
}

async function removeDatabaseSidecars(databasePath: string): Promise<void> {
  await removeIfExists(`${databasePath}-wal`);
  await removeIfExists(`${databasePath}-shm`);
}

async function removeIfExists(path: string): Promise<void> {
  if (await exists(path)) {
    await remove(path);
  }
}

async function closeDatabaseSafely(): Promise<void> {
  try {
    await closeDatabase();
  } catch {
    // La recuperación debe continuar aunque el pool ya estuviera cerrado.
  }
}

function normalizePath(path: string): string {
  return path.split("\\").join("/").toLocaleLowerCase();
}
