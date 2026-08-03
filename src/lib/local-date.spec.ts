import { describe, expect, it } from "vitest";

import { localDateKey, localMonthKey } from "@/lib/local-date";

const GUATEMALA = "America/Guatemala"; // UTC-6, sin horario de verano

describe("localDateKey", () => {
  it("usa la fecha local del negocio, no la UTC", () => {
    // 03:00 UTC del 4 = 21:00 del 3 en Guatemala
    expect(localDateKey("2026-08-04T03:00:00.000Z", GUATEMALA)).toBe(
      "2026-08-03",
    );
  });

  it("cruza el cambio de mes según la timezone", () => {
    // 05:00 UTC del 1 = 23:00 del 31 de julio en Guatemala
    expect(localDateKey("2026-08-01T05:00:00.000Z", GUATEMALA)).toBe(
      "2026-07-31",
    );
  });
});

describe("localMonthKey", () => {
  it("devuelve el año-mes local", () => {
    expect(localMonthKey("2026-08-01T05:00:00.000Z", GUATEMALA)).toBe(
      "2026-07",
    );
  });
});
