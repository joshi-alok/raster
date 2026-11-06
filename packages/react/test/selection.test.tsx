import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NumberField } from "../src/forms/NumberField";
import { SearchField } from "../src/forms/SearchField";
import { Segment, SegmentedControl } from "../src/forms/SegmentedControl";
import { Slider } from "../src/forms/Slider";
import { Chip, TagGroup } from "../src/forms/TagGroup";
import { expectAccessible } from "./axe";

describe("TagGroup", () => {
  function Disciplines(props: { onSelectionChange?: (keys: unknown) => void; selectionMode?: "single" | "multiple" }) {
    return (
      <TagGroup label="Discipline" defaultSelectedKeys={["identity"]} {...props}>
        <Chip id="identity">Identity</Chip>
        <Chip id="wayfinding">Wayfinding</Chip>
        <Chip id="editorial" isDisabled>
          Editorial
        </Chip>
      </TagGroup>
    );
  }

  it("renders a labelled field holding a list of chips with check marks", () => {
    const { container } = render(<Disciplines />);
    // React Aria's collection builder renders a <template> before the root, so skip past it.
    expect(container.querySelector(":scope > :not(template)")).toHaveClass("sw-field", "sw-chip-group");
    const grid = screen.getByRole("grid", { name: "Discipline" });
    expect(grid).toHaveClass("sw-chip-list");
    const chips = screen.getAllByRole("row");
    expect(chips).toHaveLength(3);
    for (const chip of chips) {
      expect(chip).toHaveClass("sw-chip");
      expect(chip.querySelector(".sw-chip-check")).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("selects several chips by default and reports changes", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<Disciplines onSelectionChange={onSelectionChange} />);
    const identity = screen.getByRole("row", { name: "Identity" });
    const wayfinding = screen.getByRole("row", { name: "Wayfinding" });
    expect(identity).toHaveAttribute("aria-selected", "true");
    await user.click(wayfinding);
    expect(wayfinding).toHaveAttribute("aria-selected", "true");
    expect(identity).toHaveAttribute("aria-selected", "true");
    expect(onSelectionChange).toHaveBeenCalled();
  });

  it("keeps one chip selected in single mode", async () => {
    const user = userEvent.setup();
    render(<Disciplines selectionMode="single" />);
    await user.click(screen.getByRole("row", { name: "Wayfinding" }));
    expect(screen.getByRole("row", { name: "Identity" })).toHaveAttribute("aria-selected", "false");
  });

  it("marks disabled chips", () => {
    render(<Disciplines />);
    expect(screen.getByRole("row", { name: "Editorial" })).toHaveAttribute("aria-disabled", "true");
  });

  it("has no structural accessibility violations", async () => {
    const { container } = render(<Disciplines />);
    await expectAccessible(container);
  });
});

describe("SegmentedControl", () => {
  function View(props: { onSelectionChange?: (key: unknown) => void }) {
    return (
      <SegmentedControl label="View" defaultSelectedKey="grid" {...props}>
        <Segment id="grid">Grid</Segment>
        <Segment id="list">List</Segment>
        <Segment id="map">Map</Segment>
      </SegmentedControl>
    );
  }

  it("is a labelled radio group of segments", () => {
    const { container } = render(<View />);
    expect(container.firstElementChild).toHaveClass("sw-field", "sw-segmented");
    const group = screen.getByRole("radiogroup", { name: "View" });
    expect(group).toHaveClass("sw-segmented-list");
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(screen.getByRole("radio", { name: "Grid" })).toHaveClass("sw-segment");
  });

  it("selects exactly one segment and reports the new key", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<View onSelectionChange={onSelectionChange} />);
    expect(screen.getByRole("radio", { name: "Grid" })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: "List" }));
    expect(screen.getByRole("radio", { name: "List" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Grid" })).not.toBeChecked();
    expect(onSelectionChange).toHaveBeenLastCalledWith("list");
  });

  it("does not let the selection become empty", async () => {
    const user = userEvent.setup();
    render(<View />);
    await user.click(screen.getByRole("radio", { name: "Grid" }));
    expect(screen.getByRole("radio", { name: "Grid" })).toBeChecked();
  });

  it("has no structural accessibility violations", async () => {
    const { container } = render(<View />);
    await expectAccessible(container);
  });
});

describe("SearchField", () => {
  it("renders a labelled search input with a clear button", () => {
    const { container } = render(<SearchField label="Search projects" placeholder="Name or client" />);
    expect(container.firstElementChild).toHaveClass("sw-field", "sw-search");
    const input = screen.getByRole("searchbox", { name: "Search projects" });
    expect(input).toHaveClass("sw-input", "sw-search-input");
    expect(input).toHaveAttribute("placeholder", "Name or client");
    expect(container.querySelector(".sw-search-clear .sw-search-clear-icon")).toHaveAttribute("aria-hidden", "true");
  });

  it("marks itself empty, and clears from the button and from Escape", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    const { container } = render(<SearchField label="Search projects" onClear={onClear} />);
    const root = container.firstElementChild as HTMLElement;
    const input = screen.getByRole("searchbox");
    expect(root).toHaveAttribute("data-empty");
    await user.type(input, "Linie");
    expect(root).not.toHaveAttribute("data-empty");
    await user.click(screen.getByRole("button", { name: "Clear search" }));
    expect(input).toHaveValue("");
    expect(onClear).toHaveBeenCalledTimes(1);
    await user.type(input, "Atlas{Escape}");
    expect(input).toHaveValue("");
  });

  it("submits the value on Enter", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SearchField label="Search projects" onSubmit={onSubmit} />);
    await user.type(screen.getByRole("searchbox"), "Velo{Enter}");
    expect(onSubmit).toHaveBeenCalledWith("Velo");
  });

  it("has no structural accessibility violations", async () => {
    const { container } = render(<SearchField label="Search projects" description="Titles and clients." />);
    await expectAccessible(container);
  });
});

describe("NumberField", () => {
  it("renders a labelled numeric input between decrease and increase buttons", () => {
    const { container } = render(<NumberField label="Copies" defaultValue={2} minValue={1} maxValue={20} />);
    expect(container.firstElementChild).toHaveClass("sw-field", "sw-number");
    const input = screen.getByRole("textbox", { name: "Copies" });
    expect(input).toHaveClass("sw-input", "sw-number-input");
    expect(input).toHaveValue("2");
    const steps = container.querySelectorAll(".sw-number-step");
    expect(steps).toHaveLength(2);
    expect(steps[0].querySelector('[data-sign="minus"]')).not.toBeNull();
    expect(steps[1].querySelector('[data-sign="plus"]')).not.toBeNull();
  });

  it("steps with the buttons and the arrow keys, within its limits", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberField label="Copies" defaultValue={2} minValue={1} maxValue={3} onChange={onChange} />);
    const input = screen.getByRole("textbox", { name: "Copies" });
    await user.click(screen.getByRole("button", { name: /Increase/ }));
    expect(input).toHaveValue("3");
    expect(screen.getByRole("button", { name: /Increase/ })).toBeDisabled();
    await user.click(input);
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
    expect(input).toHaveValue("1");
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it("has no structural accessibility violations", async () => {
    const { container } = render(<NumberField label="Copies" defaultValue={2} />);
    await expectAccessible(container);
  });
});

describe("Slider", () => {
  it("renders a labelled slider with its value shown", () => {
    const { container } = render(<Slider label="Gutter (px)" minValue={16} maxValue={32} defaultValue={24} />);
    expect(container.firstElementChild).toHaveClass("sw-field", "sw-slider");
    expect(container.querySelector(".sw-slider-head .sw-field-label")).toHaveTextContent("Gutter (px)");
    expect(container.querySelector(".sw-slider-output")).toHaveTextContent("24");
    const slider = screen.getByRole("slider", { name: "Gutter (px)" });
    expect(slider).toHaveValue("24");
    expect(slider.closest(".sw-slider-thumb")).not.toBeNull();
  });

  it("steps with the arrow keys and jumps to the ends with Home and End", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Slider label="Gutter (px)" minValue={16} maxValue={32} defaultValue={24} onChange={onChange} />);
    const slider = screen.getByRole("slider");
    // Focus with Tab: a click lands on the track, which reads a position from jsdom's zero-size layout.
    await user.tab();
    expect(slider).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(slider).toHaveValue("25");
    await user.keyboard("{End}");
    expect(slider).toHaveValue("32");
    await user.keyboard("{Home}");
    expect(slider).toHaveValue("16");
    expect(onChange).toHaveBeenLastCalledWith(16);
  });

  it("draws one thumb per value for a range, each named", () => {
    render(
      <Slider label="Budget" minValue={20} maxValue={150} step={5} defaultValue={[40, 90]} thumbLabels={["Minimum", "Maximum"]} />,
    );
    const thumbs = screen.getAllByRole("slider");
    expect(thumbs).toHaveLength(2);
    expect(screen.getByRole("slider", { name: /Minimum/ })).toHaveValue("40");
    expect(screen.getByRole("slider", { name: /Maximum/ })).toHaveValue("90");
  });

  it("has no structural accessibility violations", async () => {
    const { container } = render(<Slider label="Gutter (px)" defaultValue={24} />);
    await expectAccessible(container);
  });
});
