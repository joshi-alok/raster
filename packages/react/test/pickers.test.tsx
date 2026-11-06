import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ComboBox, ComboBoxItem } from "../src/forms/ComboBox";
import { expectAccessible } from "./axe";

const CITIES = ["Basel", "Bern", "Lucerne", "Lugano", "Zürich"];

function City({ onSelectionChange }: { onSelectionChange?: (key: unknown) => void }) {
  return (
    <ComboBox label="City" placeholder="Type to filter" onSelectionChange={onSelectionChange}>
      {CITIES.map((city) => (
        <ComboBoxItem key={city} id={city}>
          {city}
        </ComboBoxItem>
      ))}
    </ComboBox>
  );
}

describe("ComboBox", () => {
  it("renders a labelled combobox input with a suggestions button", () => {
    const { container } = render(<City />);
    // React Aria's collection builder may render a <template> before the root, so skip past it.
    expect(container.querySelector(":scope > :not(template)")).toHaveClass("sw-field", "sw-combobox");
    const input = screen.getByRole("combobox", { name: "City" });
    expect(input).toHaveClass("sw-input", "sw-combobox-input");
    expect(input).toHaveAttribute("placeholder", "Type to filter");
    expect(container.querySelector(".sw-combobox-button svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("filters as you type and chooses with the keyboard", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<City onSelectionChange={onSelectionChange} />);
    const input = screen.getByRole("combobox", { name: "City" });
    await user.type(input, "Lu");
    const list = await screen.findByRole("listbox");
    expect(list).toHaveClass("sw-listbox");
    expect(within(list).getAllByRole("option").map((o) => o.textContent)).toEqual(["Lucerne", "Lugano"]);
    await user.keyboard("{ArrowDown}{Enter}");
    expect(input).toHaveValue("Lucerne");
    expect(onSelectionChange).toHaveBeenLastCalledWith("Lucerne");
  });

  it("has no structural accessibility violations", async () => {
    const { container } = render(<City />);
    await expectAccessible(container);
  });
});
