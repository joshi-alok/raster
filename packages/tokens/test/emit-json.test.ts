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
  it("exposes each theme's scales as DTCG colours", () => {
    expect(json.themes.alpine.scales.glacier["700"]).toEqual({ $type: "color", $value: "#2F5F8A" });
    expect(json.themes.alpine.scales.slate["50"]).toEqual({ $type: "color", $value: "#F2F5F7" });
    expect(json.themes.zurich.scales["signal-red"]["500"]).toEqual({ $type: "color", $value: "#E5341D" });
    expect(json.themes.zurich.scales.ochre).toEqual(json.themes.alpine.scales.ochre);
  });
});
