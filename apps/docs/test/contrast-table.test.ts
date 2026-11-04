import { contrastPairs, contrastRatio, tokensJson } from "@raster/tokens";
import { describe, expect, it } from "vitest";
import { contrastTables, formatRatio, type TokensJson } from "../src/lib/contrast-table";

const tables = contrastTables(tokensJson() as unknown as TokensJson);

describe("contrastTables", () => {
  it("has one table per theme and mode, in order", () => {
    expect(tables.map((t) => `${t.theme}/${t.mode}`)).toEqual([
      "alpine/light",
      "alpine/dark",
      "zurich/light",
      "zurich/dark",
    ]);
  });

  it("checks every promised pairing, and every pairing passes", () => {
    for (const table of tables) {
      expect(table.rows).toHaveLength(contrastPairs().length);
      expect(table.rows.every((row) => row.passes)).toBe(true);
    }
  });

  it("computes ratios from the token values", () => {
    const first = tables[0].rows[0];
    expect(first).toMatchObject({ foreground: "text-primary", background: "surface-page" });
    expect(first.ratio).toBe(contrastRatio(first.foregroundValue, first.backgroundValue));
  });
});

describe("formatRatio", () => {
  it("prints two decimals", () => {
    expect(formatRatio(4.5)).toBe("4.50:1");
    expect(formatRatio(17.234)).toBe("17.23:1");
  });
});
