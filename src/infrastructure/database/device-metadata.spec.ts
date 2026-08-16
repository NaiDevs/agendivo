import { describe, expect, it } from "vitest";

import type {
  DatabaseClient,
  DatabaseExecutionResult,
} from "@/infrastructure/database/database-client";
import {
  hasPendingLocalChanges,
  markLocalChanges,
  markSynchronizationCompleted,
} from "@/infrastructure/database/device-metadata";

class FakeDatabase implements DatabaseClient {
  rows: unknown[] = [];
  executions: unknown[][] = [];

  async select<T>(): Promise<T> {
    return this.rows as T;
  }

  async execute(
    _query: string,
    bindValues: unknown[] = [],
  ): Promise<DatabaseExecutionResult> {
    this.executions.push(bindValues);
    return { rowsAffected: 1 };
  }
}

describe("device sync metadata", () => {
  it("detecta cambios locales posteriores a la última sincronización", async () => {
    const database = new FakeDatabase();
    database.rows = [
      { key: "last_local_change_at", value: "2026-08-09T20:00:00.000Z" },
      { key: "last_synced_at", value: "2026-08-09T19:00:00.000Z" },
    ];

    await expect(hasPendingLocalChanges(database)).resolves.toBe(true);
  });

  it("considera respaldados los cambios incluidos en la última copia", async () => {
    const database = new FakeDatabase();
    database.rows = [
      { key: "last_local_change_at", value: "2026-08-09T19:00:00.000Z" },
      { key: "last_synced_at", value: "2026-08-09T20:00:00.000Z" },
    ];

    await expect(hasPendingLocalChanges(database)).resolves.toBe(false);
  });

  it("persiste las marcas de cambio y sincronización", async () => {
    const database = new FakeDatabase();

    await markLocalChanges(database);
    await markSynchronizationCompleted(database, "2026-08-09T20:00:00.000Z");

    expect(database.executions[0]?.[0]).toBe("last_local_change_at");
    expect(database.executions[1]?.slice(0, 2)).toEqual([
      "last_synced_at",
      "2026-08-09T20:00:00.000Z",
    ]);
  });
});
