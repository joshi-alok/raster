import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Breadcrumb, Breadcrumbs } from "../src/navigation/Breadcrumbs";
import { Tab, TabList, TabPanel, Tabs } from "../src/navigation/Tabs";
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

describe("Tabs", () => {
  function Example({ onSelectionChange }: { onSelectionChange?: (key: unknown) => void }) {
    return (
      <Tabs onSelectionChange={onSelectionChange}>
        <TabList aria-label="Foundations">
          <Tab id="grid">Grid</Tab>
          <Tab id="type">Type</Tab>
          <Tab id="colour" isDisabled>
            Colour
          </Tab>
        </TabList>
        <TabPanel id="grid">Grid panel</TabPanel>
        <TabPanel id="type">Type panel</TabPanel>
        <TabPanel id="colour">Colour panel</TabPanel>
      </Tabs>
    );
  }

  it("renders a named tablist with the first tab selected", () => {
    render(<Example />);
    expect(screen.getByRole("tablist", { name: "Foundations" })).toHaveClass("sw-tab-list");
    const grid = screen.getByRole("tab", { name: "Grid" });
    expect(grid).toHaveClass("sw-tab");
    expect(grid).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Grid panel");
  });

  it("switches panels with the arrow keys and skips disabled tabs", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<Example onSelectionChange={onSelectionChange} />);
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Type" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Type panel");
    expect(onSelectionChange.mock.calls.at(-1)?.[0]).toBe("type");
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Grid" })).toHaveAttribute("aria-selected", "true");
  });

  it("exposes vertical orientation for styling", () => {
    render(
      <Tabs orientation="vertical">
        <TabList aria-label="Side">
          <Tab id="a">A</Tab>
        </TabList>
        <TabPanel id="a">A panel</TabPanel>
      </Tabs>,
    );
    expect(screen.getByRole("tablist")).toHaveAttribute("data-orientation", "vertical");
  });

  it("has no structural violations", async () => {
    const { container } = render(<Example />);
    await expectAccessible(container);
  });
});
