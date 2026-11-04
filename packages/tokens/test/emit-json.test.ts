import { describe, expect, it } from "vitest";
import { tokensJson } from "../src/emit-json";

describe("tokensJson", () => {
  const json = tokensJson();

  it("exposes foundation tokens as DTCG values", () => {
    expect(json.foundation["space-1"]).toEqual({ $value: "0.25rem" });
  });

  it("exposes each theme's colours per mode with $type color", () => {
    expect(json.themes.zurich.dark.danger).toEqual({ $type: "color", $value: "#F2836F" });
    expect(json.themes.alpine.light["surface-page"]).toEqual({ $type: "color", $value: "#FFFFFF" });
    expect(json.themes.alpine.radius).toEqual({ $type: "dimension", $value: "4px" });
  });
});
