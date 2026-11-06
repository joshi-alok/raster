import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Meter, meterRegion, meterState } from "../src/feedback/Meter";
import { ProgressBar } from "../src/feedback/ProgressBar";
import { expectAccessible } from "./axe";

describe("ProgressBar", () => {
  it("renders a labelled native progress element with the percentage beside the label", () => {
    const { container } = render(<ProgressBar label="Uploading proofs" value={40} />);
    expect(container.firstElementChild).toHaveClass("sw-field", "sw-progress");
    const bar = screen.getByRole("progressbar", { name: "Uploading proofs" });
    expect(bar.tagName).toBe("PROGRESS");
    expect(bar).toHaveClass("sw-progress-bar");
    expect(bar).toHaveAttribute("value", "40");
    expect(bar).toHaveAttribute("max", "100");
    expect(container.querySelector(".sw-progress-value")).toHaveTextContent("40%");
    expect(container.querySelector(".sw-progress-value")).toHaveAttribute("aria-hidden", "true");
  });

  it("maps a custom range onto the element's zero-based scale and accepts a value label", () => {
    render(<ProgressBar label="Pages" value={12} minValue={2} maxValue={22} valueLabel="12 of 22 pages" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("value", "10");
    expect(bar).toHaveAttribute("max", "20");
    expect(bar).toHaveAttribute("aria-valuetext", "12 of 22 pages");
  });

  it("has no structural accessibility violations", async () => {
    const { container } = render(<ProgressBar label="Uploading proofs" value={40} />);
    await expectAccessible(container);
  });
});

describe("meterState", () => {
  const range = { min: 0, max: 100, low: 30, high: 80 };

  it("prefers the middle when the optimum is in the middle", () => {
    expect(meterState(50, { ...range, optimum: 50 })).toBe("optimum");
    expect(meterState(90, { ...range, optimum: 50 })).toBe("suboptimum");
    expect(meterState(10, { ...range, optimum: 50 })).toBe("suboptimum");
  });

  it("prefers low values when the optimum is low", () => {
    expect(meterState(10, { ...range, optimum: 0 })).toBe("optimum");
    expect(meterState(50, { ...range, optimum: 0 })).toBe("suboptimum");
    expect(meterState(90, { ...range, optimum: 0 })).toBe("poor");
  });

  it("prefers high values when the optimum is high", () => {
    expect(meterState(90, { ...range, optimum: 100 })).toBe("optimum");
    expect(meterState(10, { ...range, optimum: 100 })).toBe("poor");
  });

  it("names the region a value falls in", () => {
    expect(meterRegion(10, 30, 80)).toBe("low");
    expect(meterRegion(50, 30, 80)).toBe("medium");
    expect(meterRegion(90, 30, 80)).toBe("high");
  });
});

describe("Meter", () => {
  it("renders a labelled native meter whose state and word agree", () => {
    const { container } = render(<Meter label="Storage" value={86} low={30} high={80} optimum={0} />);
    const meter = screen.getByRole("meter", { name: "Storage" });
    expect(meter.tagName).toBe("METER");
    expect(meter).toHaveClass("sw-meter-bar");
    expect(meter).toHaveAttribute("data-state", "poor");
    expect(meter).toHaveAttribute("aria-valuetext", "86%, High");
    expect(container.querySelector(".sw-meter-word")).toHaveTextContent("High");
  });

  it("shows no word in the middle region", () => {
    const { container } = render(<Meter label="Storage" value={50} low={30} high={80} optimum={0} />);
    expect(container.querySelector(".sw-meter-word")).toBeNull();
    expect(screen.getByRole("meter")).toHaveAttribute("data-state", "suboptimum");
  });

  it("has no structural accessibility violations", async () => {
    const { container } = render(<Meter label="Storage" value={86} low={30} high={80} optimum={0} />);
    await expectAccessible(container);
  });
});
