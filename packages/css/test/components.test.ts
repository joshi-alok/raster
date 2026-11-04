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
  it("darkens filled and outline buttons while pressed, never when disabled", () => {
    expect(css).toMatch(
      /\.sw-button\[data-pressed\]:not\(:disabled,\s*\[aria-disabled="?true"?\]\)\s*\{[^}]*background-color:\s*var\(--border\)/,
    );
    expect(css).toMatch(
      /\.sw-button\[data-variant="?primary"?\]\[data-pressed\]:not\(:disabled[^{]*\{[^}]*color-mix\(in srgb,\s*var\(--accent\) 75%/,
    );
    expect(css).toMatch(
      /\.sw-button\[data-variant="?danger"?\]\[data-pressed\]:not\(:disabled[^{]*\{[^}]*color-mix\(in srgb,\s*var\(--danger\) 75%/,
    );
  });
});

describe("disabled selected states", () => {
  it("keeps disabled unselected boxes subtle", () => {
    expect(css).toMatch(
      /\.sw-checkbox\[data-disabled\]:not\(\[data-selected\],\s*\[data-indeterminate\]\)\s+\.sw-checkbox-box\s*\{[^}]*background-color:\s*var\(--surface-subtle\)/,
    );
    expect(css).toMatch(
      /\.sw-radio\[data-disabled\]:not\(\[data-selected\]\)\s+\.sw-radio-dot\s*\{[^}]*background-color:\s*var\(--surface-subtle\)/,
    );
  });
  it("keeps disabled selected controls visible", () => {
    expect(css).toMatch(
      /\.sw-checkbox\[data-disabled\]:is\(\[data-selected\],\s*\[data-indeterminate\]\)\s+\.sw-checkbox-box\s*\{[^}]*border-color:\s*var\(--text-muted\)[^}]*background-color:\s*var\(--text-muted\)/,
    );
    expect(css).toMatch(
      /\.sw-radio\[data-disabled\]\[data-selected\]\s+\.sw-radio-dot\s*\{[^}]*border-color:\s*var\(--text-muted\)/,
    );
    expect(css).toMatch(
      /\.sw-switch\[data-disabled\]\[data-selected\]\s+\.sw-switch-track\s*\{[^}]*border-color:\s*var\(--text-muted\)[^}]*background-color:\s*var\(--text-muted\)/,
    );
  });
});

describe("switch forced colours", () => {
  it("uses system colours for thumb and selected track", () => {
    const m = css.match(/@media\s*\(forced-colors:\s*active\)\s*\{(?:(?!@media)[\s\S])*?\.sw-switch-thumb[\s\S]*?\n\}/);
    expect(m).not.toBeNull();
    const block = m?.[0] ?? "";
    expect(block).toMatch(/\.sw-switch-thumb\s*\{[^}]*forced-color-adjust:\s*none[^}]*canvastext/i);
    expect(block).toMatch(/\.sw-switch\[data-selected\]\s+\.sw-switch-track\s*\{[^}]*forced-color-adjust:\s*none[^}]*highlight\s*;/i);
    expect(block).toMatch(/\.sw-switch\[data-selected\]\s+\.sw-switch-thumb\s*\{[^}]*highlighttext/i);
  });
});

describe("invalid select", () => {
  it("marks the trigger with danger border and a thicker leading edge", () => {
    const r = rule(".sw-select[data-invalid] .sw-select-trigger");
    expect(r).toMatch(/border-color:\s*var\(--danger\)/);
    expect(r).toMatch(/border-inline-start-width:\s*4px/);
  });
  it("keeps the danger border on hover", () => {
    expect(css).toMatch(
      /\.sw-select\[data-invalid\]\s+\.sw-select-trigger:hover\s*\{[^}]*border-color:\s*var\(--danger\)/,
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

  it("keeps single-line inputs at exactly the 40px control height", () => {
    // 8px + 8px padding + 2px border + 1.25 × 16–17px text stays under 40px, so min-block-size wins.
    expect(rule(".sw-input")).toMatch(/line-height:\s*1\.25/);
    expect(rule(".sw-textarea")).toMatch(/line-height:\s*1\.5/);
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
    expect(css).toMatch(/\.sw-listbox-item\[data-focused\][^{]*\{[^}]*background-color:\s*var\(--surface-subtle\)/);
    expect(css).toMatch(/\.sw-listbox-item[^{]*\{[^}]*min-block-size:\s*var\(--control-height\)/);
  });
});

describe("overlay stylesheet", () => {
  it("keeps popover and listbox styles, now shared", () => {
    expect(rule(".sw-popover")).toMatch(/box-shadow:\s*var\(--shadow-overlay\)/);
    expect(css).toMatch(/\.sw-listbox-item,\s*\.sw-menu-item\s*\{[^}]*min-block-size:\s*var\(--control-height\)/);
    expect(css).toMatch(/\.sw-listbox-item\[data-focused\],\s*\.sw-menu-item\[data-focused\]\s*\{[^}]*var\(--surface-subtle\)/);
  });

  it("animates overlays in with a fade and short slide, and out with a fade", () => {
    expect(css).toMatch(/@keyframes sw-overlay-in\s*\{[^}]*from\s*\{[^}]*opacity:\s*0/);
    expect(css).toMatch(/:is\(\.sw-popover, \.sw-tooltip, \.sw-modal\)\[data-entering\]\s*\{[^}]*animation:\s*sw-overlay-in var\(--dur-base\) var\(--ease-standard\)/);
    expect(css).toMatch(/:is\(\.sw-popover, \.sw-tooltip, \.sw-modal\)\[data-exiting\]\s*\{[^}]*animation:\s*sw-overlay-out var\(--dur-fast\)/);
  });

  it("slides from the trigger side for each placement", () => {
    expect(css).toMatch(/\[data-placement="?top"?\]\s*\{\s*--_overlay-from:\s*translateY\(4px\)/);
    expect(css).toMatch(/\[data-placement="?left"?\]\s*\{\s*--_overlay-from:\s*translateX\(4px\)/);
  });

  it("falls back to a plain fade under reduced motion", () => {
    expect(css).toMatch(/prefers-reduced-motion: reduce[^{]*\{[^@]*\[data-entering\]\s*\{\s*animation-name:\s*sw-fade-in/);
    expect(css).toMatch(/\[data-motion="?reduce"?\] :is\(\.sw-popover, \.sw-tooltip, \.sw-modal\)\[data-entering\]\s*\{\s*animation-name:\s*sw-fade-in/);
  });
});

describe("modal dialog", () => {
  it("covers the viewport with the scrim and centres the modal", () => {
    const r = rule(".sw-modal-overlay");
    expect(r).toMatch(/position:\s*fixed/);
    expect(r).toMatch(/background-color:\s*var\(--scrim\)/);
    expect(r).toMatch(/place-items:\s*center/);
  });

  it("is a raised surface with the overlay shadow that scrolls when tall", () => {
    // overlay.css already has an earlier `.sw-modal` rule (motion custom property), so rule() would
    // return that one; match the modal.css rule by its declarations instead.
    const r = css.match(/(?:^|[}\s])\.sw-modal\s*\{([^}]*box-shadow[^}]*)\}/)?.[1] ?? "";
    expect(r).toMatch(/box-shadow:\s*var\(--shadow-overlay\)/);
    expect(r).toMatch(/background-color:\s*var\(--surface-raised\)/);
    expect(r).toMatch(/overflow:\s*auto/);
  });

  it("fades the scrim in and out", () => {
    expect(rule(".sw-modal-overlay[data-entering]")).toMatch(/animation:\s*sw-fade-in/);
    expect(rule(".sw-modal-overlay[data-exiting]")).toMatch(/animation:\s*sw-overlay-out/);
  });
});
