import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Media } from "../src/display/Media";
import { Banner } from "../src/feedback/Banner";
import { EmptyState } from "../src/feedback/EmptyState";
import { Meter, meterRegion, meterState } from "../src/feedback/Meter";
import { ProgressBar } from "../src/feedback/ProgressBar";
import { Skeleton } from "../src/feedback/Skeleton";
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

describe("Skeleton", () => {
  it("renders a hidden placeholder of the chosen shape and width", () => {
    const { container } = render(<Skeleton shape="heading" width="60%" />);
    const block = container.firstElementChild as HTMLElement;
    expect(block).toHaveClass("sw-skeleton");
    expect(block).toHaveAttribute("data-shape", "heading");
    expect(block).toHaveAttribute("aria-hidden", "true");
    expect(block.style.inlineSize).toBe("60%");
  });
});

describe("Banner", () => {
  it("is a status strip with a tone, an icon and a spoken tone word", () => {
    const { container } = render(<Banner title="Scheduled maintenance">The studio site is read-only on Sunday.</Banner>);
    const banner = screen.getByRole("status");
    expect(banner).toHaveClass("sw-banner");
    expect(banner).toHaveAttribute("data-tone", "info");
    expect(container.querySelector(".sw-banner-inner > svg")).toHaveAttribute("aria-hidden", "true");
    expect(banner).toHaveTextContent("Note:");
    expect(container.querySelector(".sw-banner-title")).toHaveTextContent("Scheduled maintenance");
  });

  it("uses the alert role for danger", () => {
    render(<Banner tone="danger">Payments are failing.</Banner>);
    expect(screen.getByRole("alert")).toHaveAttribute("data-tone", "danger");
  });

  it("can be dismissed, telling its owner and moving focus to the main content", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(
      <>
        <Banner onDismiss={onDismiss}>New projects are online.</Banner>
        <main id="main" tabIndex={-1}>
          Content
        </main>
      </>,
    );
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("status")).toBeNull();
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("main")).toHaveFocus();
  });

  it("has no structural accessibility violations", async () => {
    const { container } = render(<Banner title="Scheduled maintenance">Read-only on Sunday.</Banner>);
    await expectAccessible(container);
  });
});

describe("EmptyState", () => {
  it("renders a label, a heading at the chosen level, a sentence and an action", () => {
    const { container } = render(
      <EmptyState label="Projects" title="No projects match" headingLevel={3} action={<a href="/work/">Clear filters</a>}>
        Try fewer disciplines, or show every year.
      </EmptyState>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass("sw-empty");
    expect(root.querySelector(".sw-empty-label")).toHaveTextContent("Projects");
    expect(screen.getByRole("heading", { level: 3, name: "No projects match" })).toHaveClass("sw-empty-title");
    expect(root.querySelector(".sw-empty-text")).toHaveTextContent("Try fewer disciplines");
    expect(root.querySelector(".sw-empty-actions")).toContainElement(screen.getByRole("link", { name: "Clear filters" }));
  });

  it("has no structural accessibility violations", async () => {
    const { container } = render(<EmptyState title="No projects match">Try fewer filters.</EmptyState>);
    await expectAccessible(container);
  });
});

describe("Media", () => {
  it("frames its child at the chosen ratio with a caption", () => {
    const { container } = render(
      <Media ratio="4:3" caption="Linie 7, platform signs.">
        <img src="/sign.jpg" alt="A platform sign" />
      </Media>,
    );
    const figure = container.firstElementChild as HTMLElement;
    expect(figure.tagName).toBe("FIGURE");
    expect(figure).toHaveClass("sw-figure", "sw-media");
    expect(figure).toHaveAttribute("data-ratio", "4:3");
    expect(figure.querySelector(".sw-media-frame > img")).toHaveAttribute("alt", "A platform sign");
    expect(figure.querySelector("figcaption")).toHaveTextContent("Linie 7, platform signs.");
  });

  it("defaults to 16:9 and leaves out the caption when none is given", () => {
    const { container } = render(
      <Media>
        <img src="/a.jpg" alt="" />
      </Media>,
    );
    expect(container.firstElementChild).toHaveAttribute("data-ratio", "16:9");
    expect(container.querySelector("figcaption")).toBeNull();
  });
});
