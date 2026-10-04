import { describe, expect, it } from "vitest";

import { shouldOpenPendingPrompt, SYNC_STATUS } from "@/stores/sync.store";

describe("sync prompt state", () => {
  it("no reabre el modal cuando una lectura pendiente termina después del sync", () => {
    expect(shouldOpenPendingPrompt(true, true, SYNC_STATUS.SYNCED)).toBe(false);
  });

  it("abre el modal cuando hay cambios pendientes y conexión", () => {
    expect(shouldOpenPendingPrompt(true, true, SYNC_STATUS.IDLE)).toBe(true);
  });
});
