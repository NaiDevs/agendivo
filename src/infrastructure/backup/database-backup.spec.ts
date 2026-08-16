import { describe, expect, it } from "vitest";

import {
  createBackupFileName,
  getMissingRequiredTables,
  isSqliteHeader,
} from "@/infrastructure/backup/database-backup";

describe("database backup", () => {
  it("genera un nombre portable con fecha y hora", () => {
    const result = createBackupFileName(new Date(2026, 7, 3, 9, 7));

    expect(result).toBe("agendivo-2026-08-03_09-07.sqlite");
  });

  it("reconoce la cabecera oficial de SQLite", () => {
    const validHeader = new TextEncoder().encode("SQLite format 3\u0000");
    const invalidHeader = new TextEncoder().encode("archivo cualquiera");

    expect(isSqliteHeader(validHeader)).toBe(true);
    expect(isSqliteHeader(invalidHeader)).toBe(false);
  });

  it("detecta tablas obligatorias ausentes", () => {
    const missing = getMissingRequiredTables([
      "appointments",
      "businesses",
      "customers",
      "device_metadata",
      "employees",
      "payments",
      "services",
    ]);

    expect(missing).toEqual(["expenses"]);
  });
});
