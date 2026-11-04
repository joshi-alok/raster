import { fireEvent, render, screen } from "@testing-library/react";
import { X } from "lucide-react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../src/actions/Button";
import { IconButton } from "../src/actions/IconButton";
import { expectAccessible } from "./axe";

describe("Button", () => {
  it("is a non-submitting secondary button by default", () => {
    render(<Button>Save</Button>);
    const b = screen.getByRole("button", { name: "Save" });
    expect(b).toHaveAttribute("type", "button");
    expect(b).toHaveClass("sw-button");
    expect(b).toHaveAttribute("data-variant", "secondary");
  });

  it("applies the variant and allows submit", () => {
    render(
      <Button variant="primary" type="submit">
        Send
      </Button>,
    );
    const b = screen.getByRole("button", { name: "Send" });
    expect(b).toHaveAttribute("data-variant", "primary");
    expect(b).toHaveAttribute("type", "submit");
  });

  it("calls onClick, but not when disabled", () => {
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>Go</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
    rerender(
      <Button onClick={onClick} disabled>
        Go
      </Button>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("forwards its ref", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref</Button>);
    expect(ref.current).toBe(screen.getByRole("button"));
  });
});

describe("IconButton", () => {
  it("is named by its label and hides the icon from assistive tech", () => {
    render(
      <IconButton label="Close">
        <X />
      </IconButton>,
    );
    const b = screen.getByRole("button", { name: "Close" });
    expect(b).toHaveClass("sw-button", "sw-icon-button");
    expect(b.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("has no structural violations", async () => {
    const { container } = render(
      <div>
        <Button variant="primary">Save</Button>
        <IconButton label="Close" variant="ghost">
          <X />
        </IconButton>
      </div>,
    );
    await expectAccessible(container);
  });
});
