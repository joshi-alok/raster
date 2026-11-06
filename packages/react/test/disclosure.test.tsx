import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Accordion, Disclosure } from "../src/disclosure/Disclosure";
import { expectAccessible } from "./axe";

describe("Disclosure", () => {
  it("renders the class contract: a heading wrapping the trigger, then the panel", () => {
    const { container } = render(<Disclosure title="Delivery">Two to four weeks.</Disclosure>);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass("sw-disclosure");
    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading).toHaveClass("sw-disclosure-heading");
    const trigger = screen.getByRole("button", { name: "Delivery" });
    expect(trigger).toHaveClass("sw-disclosure-trigger");
    expect(trigger.querySelector(".sw-disclosure-icon")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".sw-disclosure-panel")).not.toBeNull();
  });

  it("toggles with the trigger and reports aria-expanded", async () => {
    const user = userEvent.setup();
    render(<Disclosure title="Delivery">Two to four weeks.</Disclosure>);
    const trigger = screen.getByRole("button", { name: "Delivery" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Two to four weeks.")).not.toBeVisible();
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Two to four weeks.")).toBeVisible();
  });

  it("accepts a heading level, a default state and a className", () => {
    const { container } = render(
      <Disclosure title="Delivery" headingLevel={2} defaultExpanded className="extra">
        Two to four weeks.
      </Disclosure>,
    );
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass("sw-disclosure", "extra");
    expect(screen.getByRole("button", { name: "Delivery" })).toHaveAttribute("aria-expanded", "true");
  });

  it("has no structural accessibility violations", async () => {
    const { container } = render(<Disclosure title="Delivery">Two to four weeks.</Disclosure>);
    await expectAccessible(container);
  });
});

describe("Accordion", () => {
  function Faq(props: { allowsMultipleExpanded?: boolean }) {
    return (
      <Accordion {...props}>
        <Disclosure id="cost" title="Cost">Fixed fee.</Disclosure>
        <Disclosure id="time" title="Time">Twelve weeks.</Disclosure>
      </Accordion>
    );
  }

  it("is a group with the accordion class", () => {
    const { container } = render(<Faq />);
    expect(container.firstElementChild).toHaveClass("sw-accordion");
  });

  it("opens one item at a time by default", async () => {
    const user = userEvent.setup();
    render(<Faq />);
    const cost = screen.getByRole("button", { name: "Cost" });
    const time = screen.getByRole("button", { name: "Time" });
    await user.click(cost);
    await user.click(time);
    expect(cost).toHaveAttribute("aria-expanded", "false");
    expect(time).toHaveAttribute("aria-expanded", "true");
  });

  it("keeps several open when allowsMultipleExpanded is set", async () => {
    const user = userEvent.setup();
    render(<Faq allowsMultipleExpanded />);
    await user.click(screen.getByRole("button", { name: "Cost" }));
    await user.click(screen.getByRole("button", { name: "Time" }));
    expect(screen.getByRole("button", { name: "Cost" })).toHaveAttribute("aria-expanded", "true");
  });
});
