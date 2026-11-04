import { beforeAll, describe, expect, it } from "vitest";
import { buildCss } from "../build.mjs";

let css = "";
beforeAll(async () => {
  css = await buildCss();
});

/** The body of the first rule whose selector is exactly `selector`. */
function rule(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/"/g, '"?');
  const match = css.match(new RegExp(`(?:^|[}\\s])${escaped}\\s*\\{([^}]*)\\}`));
  if (!match) throw new Error(`No rule for ${selector}`);
  return match[1];
}

describe("components layer", () => {
  it("holds component styles", () => {
    expect(css).toMatch(/@layer raster\.components\s*\{[\s\S]*\.sw-figure/);
  });
});

describe("figure", () => {
  it("stacks media and caption with a token gap", () => {
    expect(rule(".sw-figure")).toMatch(/display:\s*grid/);
    expect(rule(".sw-figure")).toMatch(/gap:\s*var\(--space-3\)/);
  });
});

describe("button", () => {
  it("is a 40px control with a token border and radius", () => {
    const r = rule(".sw-button");
    expect(r).toMatch(/min-block-size:\s*var\(--control-height\)/);
    expect(r).toMatch(/border:\s*1px solid var\(--border-strong\)/);
    expect(r).toMatch(/border-radius:\s*var\(--radius\)/);
    expect(r).toMatch(/font-weight:\s*500/);
  });

  it("extends the hit area to the touch target", () => {
    // Lightning CSS may print ::before as :before.
    expect(css).toMatch(
      /\.sw-button::?before\s*\{[^}]*inset-block:\s*calc\(\(var\(--control-height\) - var\(--target-min\)\) \/ 2\)/,
    );
  });

  it("styles primary, ghost and danger variants from role tokens", () => {
    expect(rule('.sw-button[data-variant="primary"]')).toMatch(/background-color:\s*var\(--accent\)/);
    expect(rule('.sw-button[data-variant="primary"]')).toMatch(/color:\s*var\(--on-accent\)/);
    expect(rule('.sw-button[data-variant="ghost"]')).toMatch(/border-color:\s*(transparent|#0000)/);
    expect(rule('.sw-button[data-variant="danger"]')).toMatch(/background-color:\s*var\(--danger\)/);
  });

  it("keeps disabled buttons legible without opacity", () => {
    expect(css).toMatch(/\.sw-button:is\(:disabled,\s*\[aria-disabled="?true"?\]\)\s*\{[^}]*color:\s*var\(--text-muted\)/);
    expect(css).not.toMatch(/\.sw-button[^{]*\{[^}]*opacity/);
  });

  it("makes icon buttons square", () => {
    expect(rule(".sw-icon-button")).toMatch(/inline-size:\s*var\(--control-height\)/);
  });
});

describe("link", () => {
  it("uses the accent colour with a thin underline that thickens on hover", () => {
    expect(rule(".sw-link")).toMatch(/color:\s*var\(--accent\)/);
    expect(rule(".sw-link")).toMatch(/text-decoration-thickness:\s*1px/);
    expect(rule(".sw-link:hover")).toMatch(/text-decoration-thickness:\s*2px/);
  });

  it("mirrors the external-link arrow in right-to-left text", () => {
    expect(css).toMatch(/\.sw-link svg:dir\(rtl\)\s*\{[^}]*scaleX\(-1\)/);
  });
});

describe("card", () => {
  it("is a flat raised surface with a hairline border and no shadow", () => {
    const r = rule(".sw-card");
    expect(r).toMatch(/background-color:\s*var\(--surface-raised\)/);
    expect(r).toMatch(/border:\s*1px solid var\(--border\)/);
    expect(r).toMatch(/border-radius:\s*var\(--radius\)/);
    expect(r).not.toMatch(/box-shadow/);
  });
});

describe("tag", () => {
  it("is a mono pill on the subtle surface", () => {
    const r = rule(".sw-tag");
    expect(r).toMatch(/border-radius:\s*var\(--radius-full\)/);
    expect(r).toMatch(/font-family:\s*var\(--font-mono\)/);
    expect(r).toMatch(/background-color:\s*var\(--surface-subtle\)/);
  });

  it("pairs each tone's tint with its text-on-tint role", () => {
    for (const tone of ["accent", "success", "warning", "danger"]) {
      const r = rule(`.sw-tag[data-tone="${tone}"]`);
      expect(r).toMatch(new RegExp(`background-color:\\s*var\\(--${tone}-subtle\\)`));
      expect(r).toMatch(new RegExp(`color:\\s*var\\(--on-${tone}-subtle\\)`));
    }
  });
});

describe("callout", () => {
  it("lays out icon and body in two columns on the accent tint by default", () => {
    const r = rule(".sw-callout");
    expect(r).toMatch(/grid-template-columns:\s*auto minmax\(0,\s*1fr\)/);
    expect(r).toMatch(/background-color:\s*var\(--accent-subtle\)/);
    expect(r).toMatch(/color:\s*var\(--on-accent-subtle\)/);
  });

  it("maps success, warning and danger tones to their tints", () => {
    for (const tone of ["success", "warning", "danger"]) {
      expect(rule(`.sw-callout[data-tone="${tone}"]`)).toMatch(
        new RegExp(`background-color:\\s*var\\(--${tone}-subtle\\)`),
      );
    }
  });

  it("keeps links inside callouts in the callout's text colour", () => {
    expect(rule(".sw-callout a")).toMatch(/color:\s*inherit/);
  });
});

describe("table", () => {
  it("scrolls horizontally inside its wrapper", () => {
    expect(rule(".sw-table-wrap")).toMatch(/overflow-x:\s*auto/);
  });

  it("separates rows with hairlines and puts a strong rule under the header", () => {
    expect(css).toMatch(/\.sw-table :is\(th, td\)\s*\{[^}]*border-block-end:\s*1px solid var\(--border\)/);
    expect(rule(".sw-table thead th")).toMatch(/border-block-end-color:\s*var\(--text-primary\)/);
  });

  it("sets numeric cells in tabular mono, end-aligned", () => {
    const r = rule(".sw-table [data-numeric]");
    expect(r).toMatch(/text-align:\s*end/);
    expect(r).toMatch(/font-variant-numeric:\s*tabular-nums/);
    expect(r).toMatch(/font-family:\s*var\(--font-mono\)/);
  });

  it("stripes body rows on the subtle surface when asked", () => {
    expect(css).toMatch(/\.sw-table\[data-striped\] tbody tr:nth-child\((?:even|2n)\)\s*\{[^}]*var\(--surface-subtle\)/);
  });
});

describe("review fixes", () => {
  it("guards every button hover rule against disabled and hover-less devices", () => {
    expect(css).not.toMatch(/\.sw-button[^{,]*:hover(?![^{,]*:not\()[^{,]*\s*\{/);
    const hovers = css.match(/\.sw-button[^{}]*:hover[^{}]*\{/g) ?? [];
    expect(hovers.length).toBeGreaterThanOrEqual(3);
    for (const h of hovers) expect(h).toMatch(/:not\(:disabled/);
    const block = css.match(/@media\s*\(hover:\s*hover\)\s*\{([\s\S]*?\n  \})/)?.[1] ?? "";
    expect((block.match(/\.sw-button[^{}]*:hover[^{}]*\{/g) ?? []).length).toBe(hovers.length);
  });

  it("spaces callout body children except the first and the one after the sr-only span", () => {
    expect(css).toMatch(/\.sw-callout-body\s*>\s*:not\(\s*:first-child\s*,\s*\.sw-sr-only\s*\+\s*\*\s*\)\s*\{[^}]*margin-block-start:\s*var\(--space-2\)/);
    expect(css).not.toMatch(/\.sw-callout-body\s*>\s*\*\s*\+\s*\*/);
  });

  it("anchors the callout's sr-only span", () => {
    expect(rule(".sw-callout")).toMatch(/position:\s*relative/);
  });
});

describe("button pressed state", () => {
  it("darkens filled and outline buttons while pressed", () => {
    expect(css).toMatch(/\.sw-button\[data-pressed\]\s*\{[^}]*background-color:\s*var\(--border\)/);
    expect(css).toMatch(
      /\.sw-button\[data-variant="?primary"?\]\[data-pressed\]\s*\{[^}]*color-mix\(in srgb,\s*var\(--accent\) 75%/,
    );
  });
});

describe("field", () => {
  it("stacks label, control, description and error", () => {
    expect(rule(".sw-field")).toMatch(/display:\s*grid/);
    expect(rule(".sw-field-label")).toMatch(/font-weight:\s*500/);
    expect(rule(".sw-field-description")).toMatch(/color:\s*var\(--text-secondary\)/);
    expect(rule(".sw-field-error")).toMatch(/color:\s*var\(--danger\)/);
  });

  it("makes inputs 40px controls with a control-strength border", () => {
    const r = rule(".sw-input");
    expect(r).toMatch(/min-block-size:\s*var\(--control-height\)/);
    expect(r).toMatch(/border:\s*1px solid var\(--border-strong\)/);
    expect(r).toMatch(/background-color:\s*var\(--surface-raised\)/);
  });

  it("marks invalid inputs with colour and a thicker leading edge", () => {
    expect(css).toMatch(/\.sw-input\[aria-invalid="?true"?\]\s*\{[^}]*border-color:\s*var\(--danger\)/);
    expect(css).toMatch(/\.sw-input\[aria-invalid="?true"?\]\s*\{[^}]*border-inline-start-width:\s*4px/);
  });

  it("lets text areas grow vertically", () => {
    expect(rule(".sw-textarea")).toMatch(/resize:\s*vertical/);
  });
});

describe("checkbox", () => {
  it("gives the whole label a 44px target", () => {
    expect(css).toMatch(/\.sw-checkbox[^{]*\{[^}]*min-block-size:\s*var\(--target-min\)/);
  });

  it("fills the box with the accent when selected or indeterminate", () => {
    expect(css).toMatch(
      /\.sw-checkbox\[data-selected\] \.sw-checkbox-box,\s*\.sw-checkbox\[data-indeterminate\] \.sw-checkbox-box\s*\{[^}]*background-color:\s*var\(--accent\)/,
    );
  });

  it("draws the focus ring on the box", () => {
    expect(css).toMatch(/\.sw-checkbox\[data-focus-visible\] \.sw-checkbox-box[^{]*\{[^}]*outline:\s*var\(--focus-width\) solid var\(--accent\)/);
  });
});

describe("switch", () => {
  it("uses a pill track and moves the thumb when selected", () => {
    expect(rule(".sw-switch-track")).toMatch(/border-radius:\s*var\(--radius-full\)/);
    expect(rule(".sw-switch[data-selected] .sw-switch-track")).toMatch(/background-color:\s*var\(--accent\)/);
    expect(rule(".sw-switch[data-selected] .sw-switch-thumb")).toMatch(/translateX\(1rem\)/);
  });

  it("mirrors the thumb in right-to-left text", () => {
    expect(css).toMatch(/\.sw-switch\[data-selected\]:dir\(rtl\) \.sw-switch-thumb\s*\{[^}]*translateX\(-1rem\)/);
  });

  it("does not animate the thumb when reduced motion is requested", () => {
    expect(css).toMatch(/prefers-reduced-motion: reduce[^{]*\{[^@]*\.sw-switch-thumb\s*\{[^}]*transition:\s*none/);
    expect(css).toMatch(/\[data-motion="?reduce"?\] \.sw-switch-thumb\s*\{[^}]*transition:\s*none/);
  });
});

describe("radio", () => {
  it("draws a round dot that becomes a thick accent ring when selected", () => {
    expect(rule(".sw-radio-dot")).toMatch(/border-radius:\s*var\(--radius-full\)/);
    expect(rule(".sw-radio[data-selected] .sw-radio-dot")).toMatch(/border:\s*6px solid var\(--accent\)/);
  });

  it("lays options out vertically, or in a row when horizontal", () => {
    expect(rule(".sw-radio-list")).toMatch(/display:\s*grid/);
    expect(rule('.sw-radio-group[data-orientation="horizontal"] .sw-radio-list')).toMatch(/display:\s*flex/);
  });
});

describe("select", () => {
  it("lays the trigger out as value plus chevron", () => {
    const r = rule(".sw-select-trigger");
    expect(r).toMatch(/display:\s*flex/);
    expect(r).toMatch(/justify-content:\s*space-between/);
  });

  it("mutes the placeholder value", () => {
    expect(rule(".sw-select-value[data-placeholder]")).toMatch(/color:\s*var\(--text-muted\)/);
  });

  it("floats the popover with the single overlay shadow at the trigger's width", () => {
    const r = rule(".sw-popover");
    expect(r).toMatch(/box-shadow:\s*var\(--shadow-overlay\)/);
    expect(r).toMatch(/min-inline-size:\s*var\(--trigger-width\)/);
    expect(r).toMatch(/background-color:\s*var\(--surface-raised\)/);
  });

  it("highlights focused options on the subtle surface", () => {
    expect(rule(".sw-listbox-item[data-focused]")).toMatch(/background-color:\s*var\(--surface-subtle\)/);
    expect(rule(".sw-listbox-item")).toMatch(/min-block-size:\s*var\(--control-height\)/);
  });
});
