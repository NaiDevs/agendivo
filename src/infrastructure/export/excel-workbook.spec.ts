import { describe, expect, it } from "vitest";

import { buildWorkbookBytes } from "@/infrastructure/export/excel-workbook";

describe("buildWorkbookBytes", () => {
  it("genera un archivo xlsx (firma ZIP 'PK') no vacío", async () => {
    const bytes = await buildWorkbookBytes("Reporte", [
      ["Ingresos", 80],
      ["Egresos", 30],
    ]);

    expect(bytes.length).toBeGreaterThan(0);
    // .xlsx es un ZIP: los dos primeros bytes son 0x50 0x4B ("PK").
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
  });
});
