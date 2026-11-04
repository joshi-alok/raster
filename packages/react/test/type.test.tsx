import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Figure } from "../src/type/Figure";
import { Heading } from "../src/type/Heading";
import { Label } from "../src/type/Label";
import { Text } from "../src/type/Text";
import { expectAccessible } from "./axe";

describe("Heading", () => {
  it("renders the level's element with the matching size by default", () => {
    render(<Heading level={2}>Columns</Heading>);
    const h = screen.getByRole("heading", { level: 2, name: "Columns" });
    expect(h.tagName).toBe("H2");
    expect(h).toHaveClass("sw-type-h2");
  });

  it("decouples visual size from semantic level", () => {
    render(<Heading level={2} size="h4">Small but level 2</Heading>);
    const h = screen.getByRole("heading", { level: 2 });
    expect(h).toHaveClass("sw-type-h4");
    expect(h).not.toHaveClass("sw-type-h2");
  });

  it("maps levels 5 and 6 to the h4 size", () => {
    render(<Heading level={6}>Deep</Heading>);
    expect(screen.getByRole("heading", { level: 6 })).toHaveClass("sw-type-h4");
  });
});

describe("Text", () => {
  it("renders a body paragraph by default", () => {
    render(<Text>Body</Text>);
    const p = screen.getByText("Body");
    expect(p.tagName).toBe("P");
    expect(p.className).toBe("sw-type-body");
  });

  it("applies size, tone, measure and mono", () => {
    render(
      <Text as="span" size="caption" tone="secondary" measure mono>
        Meta
      </Text>,
    );
    const el = screen.getByText("Meta");
    expect(el.tagName).toBe("SPAN");
    expect(el).toHaveClass("sw-type-caption", "sw-text-secondary", "sw-measure", "sw-mono");
  });
});

describe("Label", () => {
  it("renders a mono label span", () => {
    render(<Label>01 / Grid</Label>);
    const el = screen.getByText("01 / Grid");
    expect(el.tagName).toBe("SPAN");
    expect(el).toHaveClass("sw-type-label");
  });
});

describe("Figure", () => {
  it("renders media followed by a secondary caption", () => {
    render(
      <Figure caption="Figure 1 — Grid">
        <img src="grid.png" alt="A 12-column grid" />
      </Figure>,
    );
    const caption = screen.getByText("Figure 1 — Grid");
    expect(caption.tagName).toBe("FIGCAPTION");
    expect(caption).toHaveClass("sw-type-caption", "sw-text-secondary");
    expect(caption.closest("figure")).toHaveClass("sw-figure");
    expect(caption.previousElementSibling?.tagName).toBe("IMG");
  });

  it("has no structural violations", async () => {
    const { container } = render(
      <article>
        <Heading level={1}>Title</Heading>
        <Text>Body</Text>
        <Figure caption="Caption">
          <img src="a.png" alt="Alt text" />
        </Figure>
      </article>,
    );
    await expectAccessible(container);
  });
});
