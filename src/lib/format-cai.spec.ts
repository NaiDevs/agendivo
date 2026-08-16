import { describe, expect, it } from "vitest";

import { formatCai } from "@/lib/format-cai";

describe("formatCai", () => {
  it("convierte el CAI a mayúsculas y agrega los guiones autorizados", () => {
    expect(formatCai("abc123def456ghi789jkl012mno345pq")).toBe(
      "ABC123-DEF456-GHI789-JKL012-MNO345-PQ",
    );
  });

  it("elimina espacios, guiones escritos y caracteres inválidos", () => {
    expect(formatCai("abc123 - def456 / ghi789")).toBe("ABC123-DEF456-GHI789");
  });
});
