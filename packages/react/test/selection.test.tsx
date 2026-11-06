import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
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
