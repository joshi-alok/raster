import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Checkbox } from "../src/forms/Checkbox";
import { Radio, RadioGroup } from "../src/forms/RadioGroup";
import { Select, SelectItem } from "../src/forms/Select";
import { Switch } from "../src/forms/Switch";
import { TextArea, TextField } from "../src/forms/TextField";
import { expectAccessible } from "./axe";

describe("TextField", () => {
  it("labels the input and wires the description", () => {
    render(<TextField label="Email" description="We never share it." placeholder="name@company.com" />);
    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input).toHaveClass("sw-input");
    expect(input).toHaveAttribute("placeholder", "name@company.com");
    expect(input).toHaveAccessibleDescription("We never share it.");
    expect(input.closest(".sw-field")).not.toBeNull();
  });

  it("shows the error message and marks the input invalid", () => {
    render(<TextField label="Email" isInvalid errorMessage="Enter an email address." />);
    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Enter an email address.")).toHaveClass("sw-field-error");
    expect(input).toHaveAccessibleDescription("Enter an email address.");
  });

  it("reports typed values", async () => {
    const user = userEvent.setup();
    let value = "";
    render(<TextField label="Name" onChange={(v) => (value = v)} />);
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Ada");
    expect(value).toBe("Ada");
  });

  it("merges className onto the field wrapper", () => {
    render(<TextField label="Name" className="extra" />);
    expect(screen.getByRole("textbox").closest(".sw-field")).toHaveClass("extra");
  });
});

describe("TextArea", () => {
  it("renders a labelled multi-line field", () => {
    render(<TextArea label="Message" rows={4} />);
    const area = screen.getByRole("textbox", { name: "Message" });
    expect(area.tagName).toBe("TEXTAREA");
    expect(area).toHaveClass("sw-input", "sw-textarea");
    expect(area).toHaveAttribute("rows", "4");
  });
});

describe("text field accessibility", () => {
  it("has no structural violations", async () => {
    const { container } = render(
      <form>
        <TextField label="Email" description="Work address" />
        <TextField label="Name" isInvalid errorMessage="Required" />
        <TextArea label="Message" />
      </form>,
    );
    await expectAccessible(container);
  });
});

describe("Checkbox", () => {
  it("is a labelled checkbox that toggles", async () => {
    const user = userEvent.setup();
    render(<Checkbox>Remember me</Checkbox>);
    const box = screen.getByRole("checkbox", { name: "Remember me" });
    expect(box).not.toBeChecked();
    await user.click(screen.getByText("Remember me"));
    expect(box).toBeChecked();
    expect(box.closest(".sw-checkbox")).toHaveAttribute("data-selected");
  });

  it("shows a check when selected and a dash when indeterminate", () => {
    const { container, rerender } = render(<Checkbox defaultSelected>All</Checkbox>);
    expect(container.querySelector(".sw-checkbox-box svg")).not.toBeNull();
    rerender(<Checkbox isIndeterminate>All</Checkbox>);
    expect(container.querySelector(".sw-checkbox")).toHaveAttribute("data-indeterminate");
    expect(container.querySelector(".sw-checkbox-box svg")).not.toBeNull();
  });

  it("hides the visual box from assistive tech", () => {
    const { container } = render(<Checkbox>Terms</Checkbox>);
    expect(container.querySelector(".sw-checkbox-box")).toHaveAttribute("aria-hidden", "true");
  });
});

describe("Switch", () => {
  it("is a labelled switch that toggles", async () => {
    const user = userEvent.setup();
    render(<Switch>Dark mode</Switch>);
    const sw = screen.getByRole("switch", { name: "Dark mode" });
    expect(sw).not.toBeChecked();
    await user.click(screen.getByText("Dark mode"));
    expect(sw).toBeChecked();
    expect(sw.closest(".sw-switch")).toHaveAttribute("data-selected");
  });
});

describe("checkbox and switch accessibility", () => {
  it("has no structural violations", async () => {
    const { container } = render(
      <div>
        <Checkbox>Remember me</Checkbox>
        <Switch defaultSelected>Notifications</Switch>
      </div>,
    );
    await expectAccessible(container);
  });
});

describe("RadioGroup", () => {
  it("is a labelled group of radios with single selection", async () => {
    const user = userEvent.setup();
    let picked = "";
    render(
      <RadioGroup label="Theme" description="Applies to every page." onChange={(v) => (picked = v)}>
        <Radio value="alpine">Alpine</Radio>
        <Radio value="zurich">Zürich</Radio>
      </RadioGroup>,
    );
    const group = screen.getByRole("radiogroup", { name: "Theme" });
    expect(group).toHaveClass("sw-field", "sw-radio-group");
    expect(group).toHaveAccessibleDescription("Applies to every page.");
    await user.click(screen.getByText("Zürich"));
    expect(screen.getByRole("radio", { name: "Zürich" })).toBeChecked();
    expect(picked).toBe("zurich");
  });

  it("exposes orientation for horizontal layouts", () => {
    render(
      <RadioGroup label="Size" orientation="horizontal">
        <Radio value="s">S</Radio>
        <Radio value="m">M</Radio>
      </RadioGroup>,
    );
    expect(screen.getByRole("radiogroup")).toHaveAttribute("data-orientation", "horizontal");
  });

  it("shows an error when invalid", () => {
    render(
      <RadioGroup label="Plan" isInvalid errorMessage="Choose a plan.">
        <Radio value="a">A</Radio>
      </RadioGroup>,
    );
    expect(screen.getByText("Choose a plan.")).toHaveClass("sw-field-error");
  });

  it("has no structural violations", async () => {
    const { container } = render(
      <RadioGroup label="Theme" defaultValue="alpine">
        <Radio value="alpine">Alpine</Radio>
        <Radio value="zurich">Zürich</Radio>
      </RadioGroup>,
    );
    await expectAccessible(container);
  });
});

describe("Select", () => {
  const options = (
    <>
      <SelectItem id="alpine">Alpine</SelectItem>
      <SelectItem id="zurich">Zürich</SelectItem>
    </>
  );

  it("labels the trigger and shows the placeholder", () => {
    render(
      <Select label="Theme" placeholder="Choose a theme">
        {options}
      </Select>,
    );
    const trigger = screen.getByRole("button", { name: /Theme/ });
    expect(trigger).toHaveClass("sw-input", "sw-select-trigger");
    expect(screen.getByText("Choose a theme")).toHaveAttribute("data-placeholder");
  });

  it("opens a listbox and selects an option", async () => {
    const user = userEvent.setup();
    let picked: unknown = null;
    render(
      <Select label="Theme" onChange={(key) => (picked = key)}>
        {options}
      </Select>,
    );
    await user.click(screen.getByRole("button", { name: /Theme/ }));
    const listbox = await screen.findByRole("listbox");
    expect(listbox).toHaveClass("sw-listbox");
    await user.click(screen.getByRole("option", { name: "Zürich" }));
    expect(picked).toBe("zurich");
    expect(screen.getByRole("button", { name: /Zürich/ })).toBeInTheDocument();
  });

  it("shows a check on the selected option", async () => {
    const user = userEvent.setup();
    render(
      <Select label="Theme" defaultValue="alpine">
        {options}
      </Select>,
    );
    await user.click(screen.getByRole("button", { name: /Theme/ }));
    const selected = await screen.findByRole("option", { name: "Alpine" });
    expect(selected).toHaveClass("sw-listbox-item");
    expect(selected.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("has no structural violations when closed", async () => {
    const { container } = render(
      <Select label="Theme" description="Applies everywhere">
        {options}
      </Select>,
    );
    await expectAccessible(container);
  });
});
