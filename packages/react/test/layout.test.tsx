import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Col } from "../src/layout/Col";
import { Container } from "../src/layout/Container";
import { Grid } from "../src/layout/Grid";
import { Rule } from "../src/layout/Rule";
import { Section } from "../src/layout/Section";
import { Stack } from "../src/layout/Stack";
import { expectAccessible } from "./axe";

describe("Container", () => {
  it("renders a div with the container class and merges className", () => {
    render(<Container className="extra" data-testid="c" />);
    const el = screen.getByTestId("c");
    expect(el.tagName).toBe("DIV");
    expect(el).toHaveClass("sw-container", "extra");
  });

  it("renders as another element and forwards its ref", () => {
    const ref = createRef<HTMLElement>();
    render(<Container as="main" ref={ref} data-testid="c" />);
    expect(screen.getByTestId("c").tagName).toBe("MAIN");
    expect(ref.current).toBe(screen.getByTestId("c"));
  });
});

describe("Section", () => {
  it("renders a section with the section class", () => {
    render(<Section data-testid="s" />);
    expect(screen.getByTestId("s").tagName).toBe("SECTION");
    expect(screen.getByTestId("s")).toHaveClass("sw-section");
  });
});

describe("Stack", () => {
  it("sets gap and direction as data attributes", () => {
    render(<Stack gap={6} direction="row" data-testid="s" />);
    const el = screen.getByTestId("s");
    expect(el).toHaveClass("sw-stack");
    expect(el).toHaveAttribute("data-gap", "6");
    expect(el).toHaveAttribute("data-direction", "row");
  });

  it("omits data attributes for the defaults", () => {
    render(<Stack data-testid="s" />);
    expect(screen.getByTestId("s")).not.toHaveAttribute("data-gap");
    expect(screen.getByTestId("s")).not.toHaveAttribute("data-direction");
  });
});

describe("Grid", () => {
  it("maps layout, rules, debug and row gap onto the CSS contract", () => {
    render(<Grid layout="hanging" rules debug rowGap={3} data-testid="g" />);
    const el = screen.getByTestId("g");
    expect(el).toHaveClass("sw-grid");
    expect(el).toHaveAttribute("data-layout", "hanging");
    expect(el).toHaveAttribute("data-grid-rules");
    expect(el).toHaveAttribute("data-grid-debug");
    expect(el.style.getPropertyValue("--grid-row-gap")).toBe("var(--space-3)");
  });

  it("renders no optional attributes by default", () => {
    render(<Grid data-testid="g" />);
    const el = screen.getByTestId("g");
    expect(el).not.toHaveAttribute("data-layout");
    expect(el).not.toHaveAttribute("data-grid-rules");
    expect(el.getAttribute("style")).toBeNull();
  });
});

describe("Col", () => {
  it("writes spans and starts per column count as custom properties", () => {
    render(<Col span={{ 8: 4, 12: 6 }} start={{ 12: 2 }} style={{ color: "inherit" }} data-testid="c" />);
    const el = screen.getByTestId("c");
    expect(el).toHaveClass("sw-col");
    expect(el.style.getPropertyValue("--span-8")).toBe("4");
    expect(el.style.getPropertyValue("--span-12")).toBe("6");
    expect(el.style.getPropertyValue("--start-12")).toBe("2");
    expect(el.style.getPropertyValue("--span-4")).toBe("");
    expect(el.style.color).toBe("inherit");
  });

  it("renders no style attribute without spans", () => {
    render(<Col data-testid="c" />);
    expect(screen.getByTestId("c").getAttribute("style")).toBeNull();
  });
});

describe("Rule", () => {
  it("renders a separator, with a data-variant only for non-default variants", () => {
    render(
      <>
        <Rule data-testid="a" />
        <Rule variant="signal" data-testid="b" />
      </>,
    );
    expect(screen.getAllByRole("separator")).toHaveLength(2);
    expect(screen.getByTestId("a")).toHaveClass("sw-rule");
    expect(screen.getByTestId("a")).not.toHaveAttribute("data-variant");
    expect(screen.getByTestId("b")).toHaveAttribute("data-variant", "signal");
  });
});

describe("layout accessibility", () => {
  it("has no structural violations when composed", async () => {
    const { container } = render(
      <Container as="main">
        <Section>
          <Grid layout="hanging">
            <p>Label</p>
            <Stack gap={4}>
              <p>Content</p>
              <Rule />
            </Stack>
          </Grid>
        </Section>
      </Container>,
    );
    await expectAccessible(container);
  });
});
