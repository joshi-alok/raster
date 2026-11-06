import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Link } from "../src/actions/Link";
import { Reveal } from "../src/motion/Reveal";
import { Breadcrumb, Breadcrumbs } from "../src/navigation/Breadcrumbs";
import { Header } from "../src/navigation/Header";
import { Pagination, paginationItems } from "../src/navigation/Pagination";
import { SideNav, SideNavGroup, SideNavLink } from "../src/navigation/SideNav";
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
          <Link href="https://example.com/source" external>
            Source
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

  it("keeps the link in the document until its click has finished dispatching", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const menu = await screen.findByRole("dialog", { name: "Menu" });
    const link = within(menu).getByRole("link", { name: "Foundations" });
    fireEvent.click(link);
    // The browser follows the link after dispatch; a link removed during dispatch may not navigate.
    expect(link.isConnected).toBe(true);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

  it.each([
    ["Ctrl", { ctrlKey: true }],
    ["Meta", { metaKey: true }],
    ["Shift", { shiftKey: true }],
    ["Alt", { altKey: true }],
    ["middle-button", { button: 1 }],
  ])("keeps the menu open on a %s click, which opens the link elsewhere", async (_name, init) => {
    const user = userEvent.setup();
    render(<Page />);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const menu = await screen.findByRole("dialog", { name: "Menu" });
    fireEvent.click(within(menu).getByRole("link", { name: "Foundations" }), init);
    await settle();
    expect(screen.getByRole("dialog", { name: "Menu" })).toBeInTheDocument();
  });

  it("keeps the menu open when a link opens in another browsing context", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const menu = await screen.findByRole("dialog", { name: "Menu" });
    const source = within(menu).getByRole("link", { name: /Source/ });
    expect(source).toHaveAttribute("target", "_blank");
    fireEvent.click(source);
    await settle();
    expect(screen.getByRole("dialog", { name: "Menu" })).toBeInTheDocument();
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

describe("paginationItems", () => {
  it("shows every page when the gaps are single pages", () => {
    expect(paginationItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("collapses distant ranges into ellipses around the current page", () => {
    expect(paginationItems(6, 12)).toEqual([1, "ellipsis", 5, 6, 7, "ellipsis", 12]);
  });

  it("keeps the opening pages together on the first page", () => {
    expect(paginationItems(1, 12)).toEqual([1, 2, "ellipsis", 12]);
  });

  it("widens the window with more siblings", () => {
    expect(paginationItems(6, 12, 2)).toEqual([1, "ellipsis", 4, 5, 6, 7, 8, "ellipsis", 12]);
  });

  it("clamps the page into range and handles no pages", () => {
    expect(paginationItems(99, 3)).toEqual([1, 2, 3]);
    expect(paginationItems(1, 0)).toEqual([]);
  });
});

describe("Pagination", () => {
  const href = (page: number) => `?page=${page}`;

  it("is a named navigation landmark of page links", () => {
    render(<Pagination page={6} total={12} href={href} />);
    const nav = screen.getByRole("navigation", { name: "Pagination" });
    expect(nav).toHaveClass("sw-pagination");
    expect(nav.querySelector("ul")).toHaveClass("sw-pagination-list");
    expect(screen.getByRole("link", { name: "Page 12" })).toHaveAttribute("href", "?page=12");
  });

  it("marks the current page and hides the ellipses from screen readers", () => {
    const { container } = render(<Pagination page={6} total={12} href={href} />);
    expect(screen.getByRole("link", { name: "Page 6" })).toHaveAttribute("aria-current", "page");
    const ellipses = container.querySelectorAll(".sw-pagination-ellipsis");
    expect(ellipses).toHaveLength(2);
    // Hide the whole item, so screen readers do not count an empty list item.
    for (const e of ellipses) {
      expect(e.parentElement?.tagName).toBe("LI");
      expect(e.parentElement).toHaveAttribute("aria-hidden", "true");
      expect(e).not.toHaveAttribute("aria-hidden");
    }
    expect(container.querySelectorAll("li")).toHaveLength(9);
    // Previous, 1, 5, 6, 7, 12, Next: the two ellipsis items are not counted.
    expect(within(screen.getByRole("navigation")).getAllByRole("listitem")).toHaveLength(7);
  });

  it("links the previous and next pages, and omits a step that does not exist", () => {
    const { rerender } = render(<Pagination page={6} total={12} href={href} />);
    expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute("href", "?page=5");
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute("rel", "next");
    rerender(<Pagination page={1} total={12} href={href} />);
    expect(screen.queryByRole("link", { name: "Previous" })).toBeNull();
    rerender(<Pagination page={12} total={12} href={href} />);
    expect(screen.queryByRole("link", { name: "Next" })).toBeNull();
  });

  it("accepts a landmark name, labels and a className", () => {
    render(
      <Pagination aria-label="Results" previousLabel="Back" nextLabel="More" className="extra" page={2} total={3} href={href} />,
    );
    const nav = screen.getByRole("navigation", { name: "Results" });
    expect(nav).toHaveClass("sw-pagination", "extra");
    expect(screen.getByRole("link", { name: "Back" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "More" })).toBeInTheDocument();
  });

  it("has no structural accessibility violations", async () => {
    const { container } = render(<Pagination page={6} total={12} href={href} />);
    await expectAccessible(container);
  });
});

describe("SideNav", () => {
  function Docs() {
    return (
      <SideNav aria-label="Documentation">
        <SideNavLink href="/">Principles</SideNavLink>
        <SideNavGroup title="Foundations">
          <SideNavLink href="/grid">Grid</SideNavLink>
          <SideNavLink href="/type" current>
            Type
          </SideNavLink>
        </SideNavGroup>
        <SideNavGroup title="Components" defaultExpanded={false}>
          <SideNavLink href="/components">All components</SideNavLink>
        </SideNavGroup>
      </SideNav>
    );
  }

  it("is a named navigation landmark with a list of links", () => {
    render(<Docs />);
    const nav = screen.getByRole("navigation", { name: "Documentation" });
    expect(nav).toHaveClass("sw-sidenav");
    expect(nav.querySelector("ul")).toHaveClass("sw-sidenav-list");
    expect(screen.getByRole("link", { name: "Principles" })).toHaveClass("sw-sidenav-link");
  });

  it("marks the current page", () => {
    render(<Docs />);
    expect(screen.getByRole("link", { name: "Type" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Grid" })).not.toHaveAttribute("aria-current");
  });

  it("opens groups by default and toggles them", async () => {
    const user = userEvent.setup();
    render(<Docs />);
    const foundations = screen.getByRole("button", { name: "Foundations" });
    const components = screen.getByRole("button", { name: "Components" });
    expect(foundations).toHaveClass("sw-sidenav-group-title");
    expect(foundations).toHaveAttribute("aria-expanded", "true");
    expect(components).toHaveAttribute("aria-expanded", "false");
    await user.click(components);
    expect(screen.getByRole("link", { name: "All components" })).toBeVisible();
  });

  it("names the landmark Section by default", () => {
    render(
      <SideNav>
        <SideNavLink href="/">Home</SideNavLink>
      </SideNav>,
    );
    expect(screen.getByRole("navigation", { name: "Section" })).toBeInTheDocument();
  });

  it("has no structural accessibility violations", async () => {
    const { container } = render(<Docs />);
    await expectAccessible(container);
  });
});
