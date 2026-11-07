import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { BarChart, type BarChartProps, LineChart, type LineChartProps, Sparkline } from "../src";
import { expectAccessible } from "./axe";

beforeAll(() => {
  // jsdom has no PointerEvent; without one, fireEvent drops clientX and clientY.
  if (!("PointerEvent" in window)) Object.assign(window, { PointerEvent: MouseEvent });
});

const DATA = [
  { year: "2023", built: 4, planned: 2 },
  { year: "2024", built: 6, planned: 3 },
];
const SERIES = [
  { key: "built", label: "Built" },
  { key: "planned", label: "Planned" },
];

function bar(props: Partial<BarChartProps> = {}) {
  return render(
    <BarChart caption="Projects by year" data={DATA} x="year" xLabel="Year" series={SERIES} {...props} />,
  );
}

const ticks = (container: HTMLElement, axis: "x" | "y") =>
  [...container.querySelectorAll(`.sw-chart-axis[data-axis="${axis}"] .sw-chart-tick`)].map((t) => t.textContent);

describe("BarChart", () => {
  it("draws a captioned figure with a legend and one bar per value", () => {
    const { container } = bar();
    const figure = container.querySelector("figure.sw-chart") as HTMLElement;
    expect(figure).toHaveAttribute("data-chart", "bar");
    expect(figure).toHaveAttribute("data-orientation", "vertical");
    expect(figure.querySelector("figcaption.sw-chart-caption")).toHaveTextContent("Projects by year");
    const legend = [...figure.querySelectorAll(".sw-chart-legend-item")];
    expect(legend.map((li) => [li.textContent, li.getAttribute("data-series")])).toEqual([
      ["Built", "1"],
      ["Planned", "2"],
    ]);
    const bars = figure.querySelectorAll("rect.sw-chart-bar");
    expect(bars).toHaveLength(4);
    expect(bars[0]).toHaveAttribute("data-series", "1");
    expect([...bars].map((b) => b.getAttribute("height"))).toEqual(["66.6667", "33.3333", "100", "50"]);
    expect(figure.querySelector("svg.sw-chart-marks")).toHaveAttribute("aria-hidden", "true");
  });

  it("has no legend for one series", () => {
    const { container } = bar({ series: [SERIES[0]] });
    expect(container.querySelector(".sw-chart-legend")).toBeNull();
  });

  it("labels values up the y axis and categories along the x axis, with a zero line", () => {
    const { container } = bar();
    expect(ticks(container, "y")).toEqual(["0", "1", "2", "3", "4", "5", "6"]);
    expect(ticks(container, "x")).toEqual(["2023", "2024"]);
    expect(container.querySelectorAll(".sw-chart-gridline")).toHaveLength(7);
    expect(container.querySelectorAll(".sw-chart-gridline[data-zero]")).toHaveLength(1);
  });

  it("swaps the axes for horizontal bars", () => {
    const { container } = bar({ orientation: "horizontal" });
    expect(ticks(container, "y")).toEqual(["2023", "2024"]);
    expect(ticks(container, "x")[0]).toBe("0");
  });

  it("puts the values in a table behind Show data", () => {
    const { container } = bar();
    const details = container.querySelector("details.sw-chart-data") as HTMLElement;
    expect(within(details).getByText("Show data").tagName).toBe("SUMMARY");
    const table = within(details).getByRole("table", { hidden: true });
    expect(within(table).getAllByRole("columnheader", { hidden: true }).map((th) => th.textContent)).toEqual([
      "Year",
      "Built",
      "Planned",
    ]);
    const row = within(table).getByRole("rowheader", { name: "2024", hidden: true }).closest("tr") as HTMLElement;
    expect([...row.querySelectorAll("td")].map((td) => td.textContent)).toEqual(["6", "3"]);
  });

  it("names every mark and is one tab stop", () => {
    bar();
    const group = screen.getByRole("group", { name: "Projects by year" });
    const marks = within(group).getAllByRole("img");
    expect(marks.map((m) => m.getAttribute("aria-label"))).toEqual([
      "Built, 2023: 4",
      "Planned, 2023: 2",
      "Built, 2024: 6",
      "Planned, 2024: 3",
    ]);
    expect(marks.map((m) => m.getAttribute("tabindex"))).toEqual(["0", "-1", "-1", "-1"]);
  });

  it("moves between categories with Left and Right, series with Up and Down, ends with Home and End", async () => {
    const user = userEvent.setup();
    bar();
    await user.tab();
    expect(document.activeElement).toHaveAttribute("aria-label", "Built, 2023: 4");
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toHaveAttribute("aria-label", "Built, 2024: 6");
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toHaveAttribute("aria-label", "Built, 2024: 6");
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toHaveAttribute("aria-label", "Planned, 2024: 3");
    await user.keyboard("{Home}");
    expect(document.activeElement).toHaveAttribute("aria-label", "Planned, 2023: 2");
    expect(document.activeElement).toHaveAttribute("tabindex", "0");
    await user.keyboard("{End}");
    expect(document.activeElement).toHaveAttribute("aria-label", "Planned, 2024: 3");
  });

  it("moves along categories with Up and Down on horizontal bars", async () => {
    const user = userEvent.setup();
    bar({ orientation: "horizontal" });
    await user.tab();
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toHaveAttribute("aria-label", "Built, 2024: 6");
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toHaveAttribute("aria-label", "Planned, 2024: 3");
  });

  it("shows a tooltip for the focused mark, hidden from assistive technology", async () => {
    const user = userEvent.setup();
    const { container } = bar();
    expect(container.querySelector(".sw-chart-tooltip")).toBeNull();
    await user.tab();
    const tooltip = container.querySelector(".sw-chart-tooltip") as HTMLElement;
    expect(tooltip).toHaveAttribute("aria-hidden", "true");
    expect(tooltip.querySelector(".sw-chart-tooltip-title")).toHaveTextContent("2023");
    const rows = [...tooltip.querySelectorAll(".sw-chart-tooltip-row")];
    expect(rows.map((r) => r.textContent)).toEqual(["Built4", "Planned2"]);
    expect(rows[0]).toHaveAttribute("data-current");
    expect(rows[1]).not.toHaveAttribute("data-current");
    await user.tab();
    expect(container.querySelector(".sw-chart-tooltip")).toBeNull();
  });

  it("shows the tooltip for the bar nearest the pointer, and hides it when the pointer leaves", () => {
    const { container } = bar();
    const plot = container.querySelector(".sw-chart-plot") as HTMLElement;
    vi.spyOn(plot, "getBoundingClientRect").mockReturnValue({
      left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100, x: 0, y: 0, toJSON: () => ({}),
    });
    // (60, 90) is 30% across and 90% down: inside Planned 2023 (x 25–45, y 66.7–100).
    fireEvent.pointerMove(plot, { clientX: 60, clientY: 90 });
    const tooltip = container.querySelector(".sw-chart-tooltip") as HTMLElement;
    expect(tooltip.querySelector(".sw-chart-tooltip-row[data-current]")).toHaveTextContent("Planned2");
    fireEvent.pointerLeave(plot);
    expect(container.querySelector(".sw-chart-tooltip")).toBeNull();
  });

  it("draws without the focus layer when not interactive", () => {
    const { container } = bar({ interactive: false });
    expect(container.querySelector(".sw-chart-targets")).toBeNull();
    expect(container.querySelector("[tabindex]")).toBeNull();
    expect(container.querySelector("figcaption")).not.toHaveAttribute("id");
  });

  it("mutes every series but the highlighted one", () => {
    const { container } = bar({ highlight: "built" });
    const bars = [...container.querySelectorAll("rect.sw-chart-bar")];
    expect(bars.map((b) => b.hasAttribute("data-muted"))).toEqual([false, true, false, true]);
  });

  it("formats ticks, names and the table with the given format", () => {
    const { container } = bar({ format: (v) => `${v} p.` });
    expect(ticks(container, "y").at(-1)).toBe("6 p.");
    expect(screen.getByRole("img", { name: "Built, 2023: 4 p." })).toBeInTheDocument();
    expect(container.querySelector("tbody td")).toHaveTextContent("4 p.");
  });

  it("refuses a seventh series", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const seven = Array.from({ length: 7 }, (_, i) => ({ key: "built", label: `S${i}` }));
    expect(() => bar({ series: seven })).toThrow(/at most 6 series/);
  });

  it("forwards ref, merges className and passes other props to the figure", () => {
    const ref = createRef<HTMLElement>();
    const { container } = bar({ ref, className: "extra", id: "projects" });
    expect(ref.current).toBe(container.querySelector("figure"));
    expect(ref.current).toHaveClass("sw-chart", "extra");
    expect(ref.current).toHaveAttribute("id", "projects");
  });

  it("passes the structural accessibility check", async () => {
    const { container } = bar();
    await expectAccessible(container);
  });
});

const MONTHS = [
  { m: "Jan", a: 10, b: 30 },
  { m: "Feb", a: 20, b: 25 },
  { m: "Mar", a: 15, b: 40 },
];
const AB = [
  { key: "a", label: "Zürich" },
  { key: "b", label: "Basel" },
];

function line(props: Partial<LineChartProps> = {}) {
  return render(<LineChart caption="Visitors" data={MONTHS} x="m" xLabel="Month" series={AB} {...props} />);
}

describe("LineChart", () => {
  it("draws a 2px path per series, a marker per value, and no area unless asked", () => {
    const { container } = line();
    expect(container.querySelector("figure")).toHaveAttribute("data-chart", "line");
    const paths = container.querySelectorAll("path.sw-chart-line");
    expect(paths).toHaveLength(2);
    expect(paths[0]).toHaveAttribute("d", "M0,100L50,66.6667L100,83.3333");
    expect(paths[0].closest("g")).toHaveAttribute("data-series", "1");
    expect(container.querySelectorAll(".sw-chart-point")).toHaveLength(6);
    expect(container.querySelector("path.sw-chart-area")).toBeNull();
    const { container: filled } = line({ area: true });
    expect(filled.querySelectorAll("path.sw-chart-area")).toHaveLength(2);
  });

  it("labels the ends of two to four lines, and not one or five", () => {
    const { container } = line();
    expect([...container.querySelectorAll(".sw-chart-end")].map((e) => e.textContent)).toEqual(["Zürich", "Basel"]);
    const { container: one } = line({ series: [AB[0]] });
    expect(one.querySelector(".sw-chart-ends")).toBeNull();
    const keys = ["a", "b", "c", "d", "e"];
    const wide = MONTHS.map((d) => ({ ...d, c: 1, d: 2, e: 3 }));
    const { container: many } = line({ data: wide, series: keys.map((key) => ({ key, label: key })) });
    expect(many.querySelector(".sw-chart-ends")).toBeNull();
  });

  it("takes an exact domain", () => {
    const { container } = line({ domain: [0, 50] });
    expect(ticks(container, "y")).toEqual(["0", "10", "20", "30", "40", "50"]);
  });

  it("names points and moves between them; the focused point grows and a crosshair marks it", async () => {
    const user = userEvent.setup();
    const { container } = line();
    await user.tab();
    expect(document.activeElement).toHaveAttribute("aria-label", "Zürich, Jan: 10");
    expect(document.activeElement).toHaveAttribute("data-point");
    await user.keyboard("{ArrowRight}{ArrowDown}");
    expect(document.activeElement).toHaveAttribute("aria-label", "Basel, Feb: 25");
    expect(container.querySelectorAll(".sw-chart-point[data-active]")).toHaveLength(1);
    expect(container.querySelector(".sw-chart-crosshair")).toHaveStyle({ "--x": "50%" });
  });

  it("draws the highlighted series last, on top", () => {
    const { container } = line({ highlight: "a" });
    const groups = [...container.querySelectorAll("svg g")];
    expect(groups.map((g) => g.getAttribute("data-series"))).toEqual(["2", "1"]);
    expect(groups[0]).toHaveAttribute("data-muted");
  });

  it("forwards ref and merges className", () => {
    const ref = createRef<HTMLElement>();
    line({ ref, className: "extra" });
    expect(ref.current).toHaveClass("sw-chart", "extra");
  });
});

describe("Sparkline", () => {
  it("is one image named with a summary of the trend", () => {
    render(<Sparkline data={[4.1, 3.8, 5, 6.3]} label="Revenue, 12 months" />);
    const spark = screen.getByRole("img", { name: "Revenue, 12 months: from 4.1 to 6.3, low 3.8, high 6.3" });
    expect(spark).toHaveClass("sw-sparkline");
    expect(spark.querySelector("path.sw-sparkline-line")).toHaveAttribute("d", "M0,88L33.3333,100L66.6667,52L100,0");
    expect(spark.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(spark.querySelector(".sw-sparkline-point")).toHaveStyle({ "--x": "100%", "--y": "0%" });
    expect(spark.querySelector(".sw-sparkline-area")).toBeNull();
  });

  it("fills the area when asked, and says when there is no data", () => {
    const { container } = render(<Sparkline data={[1, 2]} label="Visits" area />);
    expect(container.querySelector(".sw-sparkline-area")).not.toBeNull();
    render(<Sparkline data={[]} label="Revenue" />);
    expect(screen.getByRole("img", { name: "Revenue: no data" }).querySelector(".sw-sparkline-point")).toBeNull();
  });

  it("formats the summary, forwards ref and merges className", () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Sparkline ref={ref} className="extra" data={[1, 2]} label="Cost" format={(v) => `CHF ${v}`} />);
    expect(ref.current).toHaveClass("sw-sparkline", "extra");
    expect(ref.current).toHaveAttribute("aria-label", "Cost: from CHF 1 to CHF 2, low CHF 1, high CHF 2");
  });
});
