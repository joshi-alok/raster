import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Callout } from "../src/display/Callout";
import { Card } from "../src/display/Card";
import { Tag } from "../src/display/Tag";
import { expectAccessible } from "./axe";

describe("Card", () => {
  it("renders a div card by default and an article when asked", () => {
    render(
      <>
        <Card data-testid="a">One</Card>
        <Card as="article" data-testid="b">
          Two
        </Card>
      </>,
    );
    expect(screen.getByTestId("a").tagName).toBe("DIV");
    expect(screen.getByTestId("a")).toHaveClass("sw-card");
    expect(screen.getByTestId("b").tagName).toBe("ARTICLE");
  });
});

describe("Tag", () => {
  it("renders a neutral tag without a tone attribute", () => {
    render(<Tag>Draft</Tag>);
    const t = screen.getByText("Draft");
    expect(t).toHaveClass("sw-tag");
    expect(t).not.toHaveAttribute("data-tone");
  });

  it("sets the tone", () => {
    render(<Tag tone="success">Live</Tag>);
    expect(screen.getByText("Live")).toHaveAttribute("data-tone", "success");
  });
});

describe("card and tag accessibility", () => {
  it("has no structural violations", async () => {
    const { container } = render(
      <Card as="article">
        <h2>Release</h2>
        <Tag tone="accent">New</Tag>
      </Card>,
    );
    await expectAccessible(container);
  });
});

describe("Callout", () => {
  it("defaults to the info tone and announces it", () => {
    render(<Callout>Saved drafts sync every minute.</Callout>);
    const body = screen.getByText("Saved drafts sync every minute.").closest(".sw-callout");
    expect(body).toHaveAttribute("data-tone", "info");
    expect(screen.getByText("Note:")).toHaveClass("sw-sr-only");
  });

  it("renders a title, a tone word and a hidden icon per tone", () => {
    const { container } = render(
      <Callout tone="warning" title="Check your grid">
        <p>Grids must sit inside a container.</p>
      </Callout>,
    );
    expect(screen.getByText("Warning:")).toBeInTheDocument();
    expect(screen.getByText("Check your grid")).toHaveClass("sw-callout-title");
    expect(container.querySelector(".sw-callout > svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("uses a distinct icon for each tone", () => {
    const { container } = render(
      <>
        <Callout tone="info">a</Callout>
        <Callout tone="success">b</Callout>
        <Callout tone="warning">c</Callout>
        <Callout tone="danger">d</Callout>
      </>,
    );
    const icons = [...container.querySelectorAll(".sw-callout > svg")].map((svg) => svg.getAttribute("class"));
    expect(new Set(icons).size).toBe(4);
  });

  it("has no structural violations", async () => {
    const { container } = render(
      <Callout tone="danger" title="Build failed">
        <p>
          Contrast check failed. <a href="/colour">See colour rules</a>.
        </p>
      </Callout>,
    );
    await expectAccessible(container);
  });
});
