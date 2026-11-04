import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Breadcrumb, Breadcrumbs } from "../src/navigation/Breadcrumbs";
import { expectAccessible } from "./axe";

describe("Breadcrumbs", () => {
  function Trail() {
    return (
      <Breadcrumbs>
        <Breadcrumb href="/">Home</Breadcrumb>
        <Breadcrumb href="/components">Components</Breadcrumb>
        <Breadcrumb>Button</Breadcrumb>
      </Breadcrumbs>
    );
  }

  it("is a named navigation landmark holding an ordered list", () => {
    render(<Trail />);
    const nav = screen.getByRole("navigation", { name: "Breadcrumbs" });
    const list = nav.querySelector("ol");
    expect(list).toHaveClass("sw-breadcrumbs");
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("marks the last item as the current page and draws separators only between items", () => {
    const { container } = render(<Trail />);
    expect(screen.getByText("Button").closest("[aria-current]")).toHaveAttribute("aria-current", "page");
    const seps = container.querySelectorAll(".sw-breadcrumb-separator");
    expect(seps).toHaveLength(2);
    for (const s of seps) expect(s).toHaveAttribute("aria-hidden", "true");
  });

  it("links earlier items", () => {
    render(<Trail />);
    expect(screen.getByRole("link", { name: "Components" })).toHaveAttribute("href", "/components");
  });

  it("accepts a custom landmark label", () => {
    render(
      <Breadcrumbs aria-label="You are here">
        <Breadcrumb>Only</Breadcrumb>
      </Breadcrumbs>,
    );
    expect(screen.getByRole("navigation", { name: "You are here" })).toBeInTheDocument();
  });

  it("has no structural violations", async () => {
    const { container } = render(<Trail />);
    await expectAccessible(container);
  });
});
