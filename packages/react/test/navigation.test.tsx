import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Link } from "../src/actions/Link";
import { Reveal } from "../src/motion/Reveal";
import { Breadcrumb, Breadcrumbs } from "../src/navigation/Breadcrumbs";
import { Header } from "../src/navigation/Header";
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

describe("Header", () => {
  function Page() {
    return (
      <>
        <Header
          brand={<a href="/">Raster</a>}
          actions={<button type="button">Theme</button>}
        >
          <Link href="/foundations">Foundations</Link>
          <Link href="/components" aria-current="page">
            Components
          </Link>
        </Header>
        <main id="main" tabIndex={-1}>
          Content
        </main>
      </>
    );
  }

  it("is a banner with a skip link first, then brand, nav and actions", () => {
    render(<Page />);
    const banner = screen.getByRole("banner");
    expect(banner).toHaveClass("sw-header");
    expect(banner).toHaveAttribute("data-sticky");
    const skip = screen.getByRole("link", { name: "Skip to content" });
    expect(skip).toHaveAttribute("href", "#main");
    expect(skip).toHaveClass("sw-skip-link");
    expect(banner.querySelector("a")).toBe(skip);
    expect(screen.getByRole("navigation", { name: "Main" })).toHaveClass("sw-header-nav");
    expect(screen.getByRole("button", { name: "Theme" }).closest(".sw-header-actions")).not.toBeNull();
  });

  it("puts the skip link first in the tab order", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await user.tab();
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveFocus();
  });

  it("marks the current page link", () => {
    render(<Page />);
    expect(screen.getByRole("link", { name: "Components" })).toHaveAttribute("aria-current", "page");
  });

  it("can opt out of sticky and rename the landmark and skip target", () => {
    render(
      <Header brand="Raster" sticky={false} navLabel="Primary" skipTo="#content">
        <Link href="/">Home</Link>
      </Header>,
    );
    expect(screen.getByRole("banner")).not.toHaveAttribute("data-sticky");
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute("href", "#content");
  });

  it("has no structural violations", async () => {
    const { container } = render(<Page />);
    await expectAccessible(container);
  });

  it("collapses its links into a full-screen menu in compact mode (the default)", async () => {
    const user = userEvent.setup();
    render(<Page />);
    const banner = screen.getByRole("banner");
    expect(banner).toHaveAttribute("data-compact");
    const menuButton = screen.getByRole("button", { name: "Menu" });
    expect(menuButton).toHaveClass("sw-button", "sw-header-menu-button");
    await user.click(menuButton);
    const menu = await screen.findByRole("dialog", { name: "Menu" });
    expect(menu).toHaveClass("sw-header-menu-dialog");
    expect(menu.closest(".sw-header-menu")?.parentElement).toHaveClass("sw-header-menu-overlay");
    const nav = within(menu).getByRole("navigation", { name: "Main" });
    expect(nav).toHaveClass("sw-header-menu-nav");
    expect(within(nav).getByRole("link", { name: "Components" })).toHaveAttribute("aria-current", "page");
  });

  it("closes the menu when a link is chosen", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const menu = await screen.findByRole("dialog", { name: "Menu" });
    await user.click(within(menu).getByRole("link", { name: "Foundations" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("closes the menu from Close and returns focus to the menu button", async () => {
    const user = userEvent.setup();
    render(<Page />);
    const menuButton = screen.getByRole("button", { name: "Menu" });
    await user.click(menuButton);
    await user.click(await screen.findByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    // React Aria restores focus to the trigger a frame after the overlay closes.
    await waitFor(() => expect(menuButton).toHaveFocus());
  });

  it("renders no menu when compact is false", () => {
    render(
      <Header compact={false} brand={<a href="/">Raster</a>}>
        <Link href="/foundations">Foundations</Link>
      </Header>,
    );
    expect(screen.getByRole("banner")).not.toHaveAttribute("data-compact");
    expect(screen.queryByRole("button", { name: "Menu" })).toBeNull();
  });
});

describe("Reveal", () => {
  it("wraps content in the reveal class, staggering children when asked", () => {
    render(
      <>
        <Reveal data-testid="a">One block</Reveal>
        <Reveal as="ul" stagger data-testid="b">
          <li>1</li>
          <li>2</li>
        </Reveal>
      </>,
    );
    expect(screen.getByTestId("a")).toHaveClass("sw-reveal");
    expect(screen.getByTestId("a")).not.toHaveAttribute("data-stagger");
    expect(screen.getByTestId("b").tagName).toBe("UL");
    expect(screen.getByTestId("b")).toHaveAttribute("data-stagger");
  });
});
