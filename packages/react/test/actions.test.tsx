import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { X } from "lucide-react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../src/actions/Button";
import { IconButton } from "../src/actions/IconButton";
import { Link } from "../src/actions/Link";
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

  it("calls onPress, but not when disabled", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const { rerender } = render(<Button onPress={onPress}>Go</Button>);
    await user.click(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
    rerender(
      <Button onPress={onPress} isDisabled>
        Go
      </Button>,
    );
    expect(screen.getByRole("button")).toBeDisabled();
    await user.click(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("exposes pressed and focus-visible state for styling", async () => {
    const user = userEvent.setup();
    render(<Button>State</Button>);
    await user.tab();
    expect(screen.getByRole("button")).toHaveAttribute("data-focus-visible");
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

describe("Link", () => {
  it("renders a plain link by default", () => {
    render(<Link href="/docs">Docs</Link>);
    const a = screen.getByRole("link", { name: "Docs" });
    expect(a).toHaveClass("sw-link");
    expect(a).not.toHaveAttribute("target");
  });

  it("opens external links in a new tab and says so to screen readers", () => {
    render(
      <Link href="https://example.com" external>
        Example
      </Link>,
    );
    const a = screen.getByRole("link", { name: "Example (opens in a new tab)" });
    expect(a).toHaveAttribute("target", "_blank");
    expect(a).toHaveAttribute("rel", "noopener noreferrer");
    expect(a.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("has no structural violations", async () => {
    const { container } = render(
      <p>
        Read the <Link href="/docs">docs</Link> or <Link href="https://example.com" external>example</Link>.
      </p>,
    );
    await expectAccessible(container);
  });

  it("supports onPress and reports disabled links", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(
      <>
        <Link href="/a" onPress={onPress}>
          Pressable
        </Link>
        <Link href="/b" isDisabled>
          Disabled
        </Link>
      </>,
    );
    await user.click(screen.getByText("Pressable"));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Disabled").closest(".sw-link")).toHaveAttribute("data-disabled");
  });
});

describe("Link rel merging", () => {
  it("keeps the caller's rel alongside noopener noreferrer", () => {
    render(<Link external rel="sponsored" href="https://x.test">x</Link>);
    expect(screen.getByRole("link")).toHaveAttribute("rel", "noopener noreferrer sponsored");
  });
});
