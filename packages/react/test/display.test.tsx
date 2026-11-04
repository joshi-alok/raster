import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
