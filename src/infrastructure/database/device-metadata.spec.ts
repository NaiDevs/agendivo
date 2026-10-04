import { describe, expect, it } from "vitest";

import type {
  DatabaseClient,
  DatabaseExecutionResult,
} from "@/infrastructure/database/database-client";
import {
  getLastSyncedAt,
  hasPendingLocalChanges,
  markLocalChanges,
  markSynchronizationCompleted,
} from "@/infrastructure/database/device-metadata";

class FakeDatabase implements DatabaseClient {
  rows: unknown[] = [];
  executions: unknown[][] = [];
  selections: unknown[][] = [];

  async select<T>(_query: string, bindValues: unknown[] = []): Promise<T> {
    this.selections.push(bindValues);
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
  const businessId = "11111111-1111-4111-8111-111111111111";

  it("detecta cambios locales posteriores a la última sincronización", async () => {
    const database = new FakeDatabase();
    database.rows = [
      {
        key: `last_local_change_at:${businessId}`,
        value: "2026-08-09T20:00:00.000Z",
      },
      {
        key: `last_synced_at:${businessId}`,
        value: "2026-08-09T19:00:00.000Z",
      },
    ];

    await expect(hasPendingLocalChanges(database, businessId)).resolves.toBe(
      true,
    );
  });

  it("considera respaldados los cambios incluidos en la última copia", async () => {
    const database = new FakeDatabase();
    database.rows = [
      {
        key: `last_local_change_at:${businessId}`,
        value: "2026-08-09T19:00:00.000Z",
      },
      {
        key: `last_synced_at:${businessId}`,
        value: "2026-08-09T20:00:00.000Z",
      },
    ];

    await expect(hasPendingLocalChanges(database, businessId)).resolves.toBe(
      false,
    );
  });

  it("persiste las marcas de cambio y sincronización", async () => {
    const database = new FakeDatabase();

    await markLocalChanges(database, businessId);
    await markSynchronizationCompleted(
      database,
      businessId,
      "2026-08-09T20:00:00.000Z",
    );

    expect(database.executions[0]?.[0]).toBe(
      `last_local_change_at:${businessId}`,
    );
    expect(database.executions[1]?.slice(0, 2)).toEqual([
      `last_synced_at:${businessId}`,
      "2026-08-09T20:00:00.000Z",
    ]);
  });

  it("consulta la última sincronización sin compartirla entre negocios", async () => {
    const database = new FakeDatabase();
    const otherBusinessId = "22222222-2222-4222-8222-222222222222";
    database.rows = [{ value: "2026-08-09T20:00:00.000Z" }];

    await expect(getLastSyncedAt(database, otherBusinessId)).resolves.toBe(
      "2026-08-09T20:00:00.000Z",
    );
    expect(database.selections[0]).toEqual([
      `last_synced_at:${otherBusinessId}`,
    ]);
  });
});
