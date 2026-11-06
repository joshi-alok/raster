import { isWeekend, parseDate } from "@internationalized/date";
import { act } from "react";
import { Calendar, RangeCalendar } from "../src/forms/Calendar";
import { DatePicker, DateRangePicker } from "../src/forms/DatePicker";
import { render, screen, waitFor, within } from "@testing-library/react";
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

/** Moves focus onto a calendar day, as a click or Tab would, without selecting it. */
function focusDay(container: HTMLElement, selector: string) {
  const cell = container.querySelector<HTMLElement>(selector);
  if (!cell) throw new Error(`No day matches ${selector}`);
  act(() => cell.focus());
}

describe("Calendar", () => {
  it("shows the month of its value, with previous and next buttons", () => {
    const { container } = render(<Calendar aria-label="Delivery day" defaultValue={parseDate("2026-03-12")} />);
    expect(container.querySelector(".sw-calendar")).not.toBeNull();
    expect(screen.getByRole("heading")).toHaveTextContent("March 2026");
    // React Aria adds a visually hidden "Next" button after the grid for screen readers, so look in the header.
    const header = container.querySelector<HTMLElement>(".sw-calendar-header")!;
    expect(within(header).getByRole("button", { name: "Previous" })).toHaveClass("sw-calendar-nav");
    expect(within(header).getByRole("button", { name: "Next" })).toHaveClass("sw-calendar-nav");
    expect(screen.getByRole("grid")).toHaveClass("sw-calendar-grid");
    expect(container.querySelector(".sw-calendar-cell[data-selected]")).toHaveTextContent("12");
  });

  it("moves by day with arrows and by month with Page Down, and selects with Enter", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <Calendar aria-label="Delivery day" defaultValue={parseDate("2026-03-12")} onChange={onChange} />,
    );
    focusDay(container, ".sw-calendar-cell[data-selected]");
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toHaveTextContent("13");
    await user.keyboard("{PageDown}");
    expect(screen.getByRole("heading")).toHaveTextContent("April 2026");
    await user.keyboard("{Enter}");
    expect(String(onChange.mock.calls.at(-1)?.[0])).toBe("2026-04-13");
  });

  it("marks unavailable days and will not select them", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <Calendar
        aria-label="Delivery day"
        defaultValue={parseDate("2026-03-13")}
        isDateUnavailable={(date) => isWeekend(date, "de-CH")}
        onChange={onChange}
      />,
    );
    focusDay(container, ".sw-calendar-cell[data-selected]");
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toHaveTextContent("14");
    expect(document.activeElement).toHaveAttribute("data-unavailable");
    await user.keyboard("{Enter}");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("has no structural accessibility violations", async () => {
    const { container } = render(<Calendar aria-label="Delivery day" defaultValue={parseDate("2026-03-12")} />);
    await expectAccessible(container);
  });
});

describe("RangeCalendar", () => {
  it("marks the start, the end and the days between", () => {
    const { container } = render(
      <RangeCalendar aria-label="Booking" defaultValue={{ start: parseDate("2026-03-09"), end: parseDate("2026-03-13") }} />,
    );
    expect(container.querySelector(".sw-calendar.sw-range-calendar")).not.toBeNull();
    expect(container.querySelector(".sw-calendar-cell[data-selection-start]")).toHaveTextContent("9");
    expect(container.querySelector(".sw-calendar-cell[data-selection-end]")).toHaveTextContent("13");
    expect(container.querySelectorAll(".sw-calendar-cell[data-selected]")).toHaveLength(5);
  });
});

describe("DatePicker", () => {
  it("renders a labelled group of date segments with a calendar button", () => {
    const { container } = render(<DatePicker label="Delivery date" defaultValue={parseDate("2026-03-12")} />);
    expect(container.querySelector(":scope > :not(template)")).toHaveClass("sw-field", "sw-date-picker");
    const group = screen.getByRole("group", { name: "Delivery date" });
    expect(group).toHaveClass("sw-input", "sw-date-field");
    expect(within(group).getAllByRole("spinbutton").map((s) => s.textContent)).toEqual(["3", "12", "2026"]);
    expect(within(group).getByRole("button", { name: /Calendar/ })).toHaveClass("sw-date-button");
  });

  it("opens a calendar on its value and closes when a day is chosen", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DatePicker label="Delivery date" defaultValue={parseDate("2026-03-12")} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /Calendar/ }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog.closest(".sw-popover")).toHaveClass("sw-calendar-popover");
    expect(within(dialog).getByRole("heading")).toHaveTextContent("March 2026");
    await user.click(within(dialog).getByText("20"));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(String(onChange.mock.calls.at(-1)?.[0])).toBe("2026-03-20");
    expect(screen.getAllByRole("spinbutton")[1]).toHaveTextContent("20");
  });

  it("has no structural accessibility violations", async () => {
    const { container } = render(
      <DatePicker label="Delivery date" description="From 2 March." defaultValue={parseDate("2026-03-12")} />,
    );
    await expectAccessible(container);
  });
});

describe("DateRangePicker", () => {
  const period = { start: parseDate("2026-03-09"), end: parseDate("2026-03-13") };

  it("renders start and end segments in one labelled group", () => {
    render(<DateRangePicker label="Project period" defaultValue={period} />);
    const group = screen.getByRole("group", { name: "Project period" });
    expect(within(group).getAllByRole("spinbutton").map((s) => s.textContent)).toEqual(["3", "9", "2026", "3", "13", "2026"]);
  });

  it("opens a range calendar showing the range", async () => {
    const user = userEvent.setup();
    render(<DateRangePicker label="Project period" defaultValue={period} />);
    await user.click(screen.getByRole("button", { name: /Calendar/ }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog.querySelector(".sw-range-calendar")).not.toBeNull();
    expect(dialog.querySelector(".sw-calendar-cell[data-selection-start]")).toHaveTextContent("9");
    expect(dialog.querySelector(".sw-calendar-cell[data-selection-end]")).toHaveTextContent("13");
  });
});
