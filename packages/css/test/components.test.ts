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
    expect(r).toMatch(/z-index:\s*var\(--z-modal\)/);
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

describe("tooltip", () => {
  it("inverts the page colours for a compact, high-contrast label", () => {
    // overlay.css already has a grouped `.sw-popover, .sw-tooltip` rule, so rule() would return that
    // one; match the tooltip.css rule by a declaration unique to it.
    const r = css.match(/(?:^|[}\s])\.sw-tooltip\s*\{([^}]*max-inline-size[^}]*)\}/)?.[1] ?? "";
    expect(r).toMatch(/background-color:\s*var\(--text-primary\)/);
    expect(r).toMatch(/color:\s*var\(--surface-page\)/);
    expect(r).toMatch(/font-size:\s*var\(--text-caption-size\)/);
    expect(r).toMatch(/max-inline-size:\s*16rem/);
  });
});

describe("toast", () => {
  it("pins the region to the inline-end bottom corner", () => {
    const r = rule(".sw-toast-region");
    expect(r).toMatch(/position:\s*fixed/);
    expect(r).toMatch(/inset-inline-end:\s*var\(--space-5\)/);
    expect(r).toMatch(/inset-block-end:\s*var\(--space-5\)/);
    expect(r).toMatch(/z-index:\s*var\(--z-toast\)/);
  });

  it("is a raised surface with icon, content and close button in a row", () => {
    const r = rule(".sw-toast");
    expect(r).toMatch(/grid-template-columns:\s*auto minmax\(0,\s*1fr\) auto/);
    expect(r).toMatch(/box-shadow:\s*var\(--shadow-overlay\)/);
  });

  it("colours the tone icon from role tokens", () => {
    expect(rule('.sw-toast[data-tone="danger"] .sw-toast-icon')).toMatch(/color:\s*var\(--danger\)/);
    expect(rule('.sw-toast[data-tone="success"] .sw-toast-icon')).toMatch(/color:\s*var\(--success\)/);
  });
});

describe("overlay review fixes", () => {
  it("draws the menu separator as a zero-height border", () => {
    const r = rule(".sw-menu-separator");
    expect(r).toMatch(/block-size:\s*0/);
    expect(r).toMatch(/border-block-start:\s*1px solid var\(--border\)/);
    expect(r).not.toMatch(/background-color/);
  });

  it("outlines focused listbox and menu items in forced-colors mode", () => {
    expect(css).toMatch(
      /@media \(forced-colors:\s*active\)\s*\{\s*\.sw-listbox-item\[data-focused\],\s*\.sw-menu-item\[data-focused\]\s*\{[^}]*outline:\s*1px solid highlight/i,
    );
  });
});

describe("link states", () => {
  it("marks the current page with weight and a thick underline", () => {
    const r = rule('.sw-link[aria-current="page"]');
    expect(r).toMatch(/font-weight:\s*500/);
    expect(r).toMatch(/text-decoration-thickness:\s*2px/);
  });

  it("mutes disabled links", () => {
    expect(rule(".sw-link[data-disabled]")).toMatch(/color:\s*var\(--text-muted\)/);
  });
});

describe("breadcrumbs", () => {
  it("sets the trail in caption size through the type variables, so li children follow", () => {
    const r = rule(".sw-breadcrumbs");
    expect(r).toMatch(/--_size:\s*var\(--text-caption-size\)/);
    expect(r).toMatch(/list-style:\s*none/);
    expect(r).toMatch(/flex-wrap:\s*wrap/);
  });

  it("mutes the separator and sets it in mono", () => {
    const r = rule(".sw-breadcrumb-separator");
    expect(r).toMatch(/color:\s*var\(--text-muted\)/);
    expect(r).toMatch(/font-family:\s*var\(--font-mono\)/);
  });

  it("shows the current page as plain primary text", () => {
    const r = rule('.sw-breadcrumb .sw-link[aria-current="page"]');
    expect(r).toMatch(/color:\s*var\(--text-primary\)/);
    expect(r).toMatch(/text-decoration-line:\s*none/);
  });
});

describe("tabs", () => {
  it("underlines the list with an inset hairline and gives tabs a 44px target", () => {
    expect(rule(".sw-tab-list")).toMatch(/box-shadow:\s*inset 0 -1px 0 var\(--border\)/);
    expect(rule(".sw-tab-list")).not.toMatch(/border-block-end/);
    expect(rule(".sw-tab")).toMatch(/min-block-size:\s*var\(--target-min\)/);
  });

  it("keeps the indicator inside the list: no negative margins on tabs", () => {
    expect(css).not.toMatch(/\.sw-tab[^{]*\{[^}]*margin-block-end:\s*-1px/);
    expect(css).not.toMatch(/\.sw-tab[^{]*\{[^}]*margin-inline-end:\s*-1px/);
  });

  it("draws the vertical hairline inset, mirrored in RTL", () => {
    const v = rule('.sw-tab-list[data-orientation="vertical"]');
    expect(v).toMatch(/box-shadow:\s*inset -1px 0 0 var\(--border\)/);
    expect(v).not.toMatch(/border-inline-end/);
    expect(rule('.sw-tab-list[data-orientation="vertical"]:dir(rtl)')).toMatch(
      /box-shadow:\s*inset 1px 0 0 var\(--border\)/,
    );
  });

  it("draws the tab focus ring inset so the scroll container cannot clip it", () => {
    expect(rule(".sw-tab[data-focus-visible]")).toMatch(/outline-offset:\s*calc\(-1 \* var\(--focus-width\)\)/);
  });

  it("keeps selection and disabled state visible in forced colours", () => {
    expect(css).toMatch(/forced-colors: active[\s\S]*\.sw-tab\[data-selected\]\s*\{[^}]*border-block-end-color:\s*highlight/i);
    expect(css).toMatch(
      /forced-colors: active[\s\S]*data-orientation="?vertical"?\] \.sw-tab\[data-selected\]\s*\{[^}]*border-inline-end-color:\s*highlight/i,
    );
    expect(css).toMatch(/forced-colors: active[\s\S]*\.sw-tab\[data-disabled\]\s*\{[^}]*color:\s*graytext/i);
  });

  it("marks the selected tab with an accent underline and weight, not colour alone", () => {
    const r = rule(".sw-tab[data-selected]");
    expect(r).toMatch(/border-block-end-color:\s*var\(--accent\)/);
    expect(r).toMatch(/font-weight:\s*500/);
  });

  it("moves the indicator to the inline end in vertical tabs", () => {
    expect(rule('.sw-tab-list[data-orientation="vertical"] .sw-tab[data-selected]')).toMatch(
      /border-inline-end-color:\s*var\(--accent\)/,
    );
  });
});

describe("header", () => {
  it("draws nav link focus rings inset so the scrolling nav cannot clip them", () => {
    expect(rule(".sw-header-nav .sw-link:focus-visible")).toMatch(
      /outline-offset:\s*calc\(-1 \* var\(--focus-width\)\)/,
    );
  });

  it("sticks to the top below modals and toasts", () => {
    const r = rule(".sw-header[data-sticky]");
    expect(r).toMatch(/position:\s*sticky/);
    expect(r).toMatch(/z-index:\s*var\(--z-sticky\)/);
  });

  it("keeps focused content clear of the sticky header (WCAG 2.4.11)", () => {
    expect(css).toMatch(
      /:root:has\(\.sw-header\[data-sticky\]\)\s*\{[^}]*scroll-padding-block-start:\s*calc\(var\(--header-height\) \+ var\(--space-4\)\)/,
    );
  });

  it("clips the skip link to nothing until it is focused, wherever the header sits", () => {
    expect(rule(".sw-skip-link:not(:focus)")).toMatch(/clip-path:\s*inset\(50%\)/);
    expect(rule(".sw-skip-link")).not.toMatch(/transform/);
  });

  it("marks the current nav item (page or section) with weight and underline", () => {
    const r = rule('.sw-header-nav .sw-link[aria-current]:not([aria-current="false"])');
    expect(r).toMatch(/font-weight:\s*500/);
    expect(r).toMatch(/text-decoration-line:\s*underline/);
  });
});

describe("disclosure", () => {
  it("separates rows with hairlines; an accordion adds one above the first row", () => {
    expect(rule(".sw-disclosure")).toMatch(/border-block-end:\s*1px solid var\(--border\)/);
    expect(rule(".sw-accordion")).toMatch(/border-block-start:\s*1px solid var\(--border\)/);
  });

  it("makes the trigger a full-width 44px row on both routes", () => {
    const r = rule(".sw-disclosure-trigger");
    expect(r).toMatch(/inline-size:\s*100%/);
    expect(r).toMatch(/min-block-size:\s*var\(--target-min\)/);
    expect(r).toMatch(/list-style:\s*none/);
    expect(css).toMatch(/summary\.sw-disclosure-trigger::?-webkit-details-marker\s*\{[^}]*display:\s*none/);
  });

  it("draws the plus with borders (visible in forced colours) and drops the vertical bar when open", () => {
    // Lightning CSS drops currentColor from the border shorthand, since it is the default.
    expect(css).toMatch(/\.sw-disclosure-icon::?before,\s*\.sw-disclosure-icon::?after\s*\{[^}]*border-block-start:\s*1\.5px solid(?:\s+currentColor)?\s*;/i);
    expect(css).toMatch(/:is\(details\[open\] > summary,\s*\[aria-expanded="?true"?\]\) > \.sw-disclosure-icon::?after\s*\{[^}]*display:\s*none/);
  });

  it("animates the native panel's height, and not under reduced motion", () => {
    expect(css).toMatch(/\.sw-disclosure::details-content\s*\{[^}]*transition:[^}]*block-size var\(--dur-base\)/);
    expect(css).toMatch(/\.sw-disclosure\[open\]::details-content\s*\{[^}]*block-size:\s*auto/);
    expect(css).toMatch(/\[data-motion="?reduce"?\] \.sw-disclosure::details-content\s*\{[^}]*transition:\s*none/);
  });
});

describe("popover (content)", () => {
  it("holds content in a padded dialog with a capped width", () => {
    expect(rule(".sw-popover-content")).toMatch(/max-inline-size:\s*min\(20rem/);
    expect(rule(".sw-popover-content")).toMatch(/padding:\s*0/);
    expect(rule(".sw-popover-dialog")).toMatch(/padding:\s*var\(--space-4\)/);
  });

  it("anchors native popovers below their trigger only where anchor positioning exists", () => {
    expect(css).toMatch(/@supports \(position-anchor:\s*--a\)\s*\{[\s\S]*?\[popover\]\.sw-popover\s*\{[^}]*position-area:\s*block-end span-inline-end/);
  });

  it("fades native popovers in with a short slide, from a starting style", () => {
    expect(css).toMatch(/@starting-style\s*\{[\s\S]*?\[popover\]\.sw-popover:popover-open/);
  });
});

describe("drawer", () => {
  it("docks a full-height panel to the inline end with the overlay shadow", () => {
    const r = rule(".sw-drawer");
    expect(r).toMatch(/position:\s*fixed/);
    expect(r).toMatch(/inset-inline:\s*auto 0/);
    expect(r).toMatch(/inline-size:\s*min\(100%,\s*28rem\)/);
    expect(r).toMatch(/box-shadow:\s*var\(--shadow-overlay\)/);
    expect(r).toMatch(/margin:\s*0/);
  });

  it("docks to the bottom as a sheet", () => {
    const r = rule('.sw-drawer[data-placement="bottom"]');
    expect(r).toMatch(/inset-block:\s*auto 0/);
    expect(r).toMatch(/max-block-size:\s*85dvh/);
  });

  it("dims the page behind on both routes", () => {
    expect(rule(".sw-drawer-overlay")).toMatch(/background-color:\s*var\(--scrim\)/);
    expect(css).toMatch(/dialog\.sw-drawer::backdrop\s*\{[^}]*background-color:\s*var\(--scrim\)/);
  });

  it("slides along one axis, mirrored in RTL, and only fades under reduced motion", () => {
    expect(css).toMatch(/\.sw-drawer:dir\(rtl\)\s*\{[^}]*--_drawer-from:\s*translateX\(-100%\)/);
    expect(css).toMatch(/\[data-motion="?reduce"?\] \.sw-drawer\s*\{[^}]*--_drawer-from:\s*none/);
  });
});

describe("header compact mode", () => {
  it("makes a compact header a named inline-size container", () => {
    expect(rule(".sw-header[data-compact]")).toMatch(/container:\s*sw-header\s*\/\s*inline-size/);
  });

  it("swaps the links for the menu button below 600px of header width", () => {
    expect(rule(".sw-header-menu-button")).toMatch(/display:\s*none/);
    expect(css).toMatch(
      /@container sw-header \(width < 600px\)\s*\{[\s\S]*?\.sw-header-nav\s*\{[^}]*display:\s*none[\s\S]*?\.sw-header-menu-button\s*\{[^}]*display:\s*inline-flex/,
    );
  });

  it("opens a full-screen menu on the page surface, on both routes", () => {
    const r = rule(".sw-header-menu");
    expect(r).toMatch(/position:\s*fixed/);
    expect(r).toMatch(/inset:\s*0/);
    expect(r).toMatch(/max-inline-size:\s*none/);
    expect(r).toMatch(/background-color:\s*var\(--surface-page\)/);
    expect(rule(".sw-header-menu-overlay")).toMatch(/z-index:\s*var\(--z-modal\)/);
  });

  it("sets links large, numbered in mono without announcing the numbers, with a signal bar on the current one", () => {
    const link = rule(".sw-header-menu-nav .sw-link");
    expect(link).toMatch(/font-size:\s*var\(--text-h2-size\)/);
    expect(link).toMatch(/border-block-end:\s*1px solid var\(--border\)/);
    expect(css).toMatch(/\.sw-header-menu-nav \.sw-link::?before\s*\{[^}]*content:\s*counter\(sw-menu,\s*decimal-leading-zero\)\s*\/\s*""/);
    expect(css).toMatch(
      /\.sw-header-menu-nav \.sw-link\[aria-current\]:not\(\[aria-current="?false"?\]\)\s*\{[^}]*border-inline-start-color:\s*var\(--brand-signal\)/,
    );
  });

  it("keeps the current-page bar visible in forced colours, which replace --brand-signal", () => {
    expect(css).toMatch(
      /@media \(forced-colors:\s*active\)\s*\{\s*\.sw-header-menu-nav \.sw-link\[aria-current\]:not\(\[aria-current="?false"?\]\)\s*\{[^}]*border-inline-start-color:\s*highlight/i,
    );
  });
});

describe("pagination", () => {
  it("gives every page link a 44px target in tabular mono figures", () => {
    const r = rule(".sw-pagination-link");
    expect(r).toMatch(/min-inline-size:\s*var\(--target-min\)/);
    expect(r).toMatch(/min-block-size:\s*var\(--target-min\)/);
    expect(r).toMatch(/font-family:\s*var\(--font-mono\)/);
    expect(r).toMatch(/font-variant-numeric:\s*tabular-nums/);
  });

  it("marks the current page with weight and a 2px underline, not colour alone", () => {
    const r = rule('.sw-pagination-link[aria-current="page"]');
    expect(r).toMatch(/font-weight:\s*500/);
    expect(r).toMatch(/text-decoration-thickness:\s*2px/);
  });

  it("mirrors the step arrows in RTL", () => {
    expect(css).toMatch(/\.sw-pagination-step svg:dir\(rtl\)\s*\{[^}]*transform:\s*scaleX\(-1\)/);
  });
});

describe("sidenav", () => {
  it("hangs the list from a hairline on the inline-start edge", () => {
    const r = rule(".sw-sidenav-list");
    expect(r).toMatch(/border-inline-start:\s*1px solid var\(--border\)/);
    expect(r).toMatch(/list-style:\s*none/);
  });

  it("gives links and group titles a 44px row with room for the current-item bar", () => {
    // Lightning CSS prints transparent as #0000.
    expect(css).toMatch(/\.sw-sidenav-link,\s*\.sw-sidenav-group-title\s*\{[^}]*min-block-size:\s*var\(--target-min\)[^}]*border-inline-start:\s*2px solid (?:transparent|#0000)\b/);
  });

  it("marks the current item with an accent bar and weight, not colour alone", () => {
    const r = rule('.sw-sidenav-link[aria-current]:not([aria-current="false"])');
    expect(r).toMatch(/border-inline-start-color:\s*var\(--accent\)/);
    expect(r).toMatch(/font-weight:\s*500/);
  });
});

describe("chips (TagGroup)", () => {
  it("are pill-shaped 32px chips with a 44px hit area", () => {
    const r = rule(".sw-chip");
    expect(r).toMatch(/border-radius:\s*var\(--radius-full\)/);
    expect(r).toMatch(/min-block-size:\s*2rem/);
    expect(css).toMatch(/\.sw-chip::?before\s*\{[^}]*inset-block:\s*calc\(\(2rem - var\(--target-min\)\) \/ 2\)/);
  });

  it("keep the native input focusable but invisible", () => {
    const r = rule(".sw-chip-input");
    expect(r).toMatch(/opacity:\s*0/);
    expect(r).toMatch(/position:\s*absolute/);
  });

  // Lightning CSS prints `:has(> x)` as `:has( > x)`, hence the optional space.
  it("mark selection on both routes with a check and a tint, never colour alone", () => {
    expect(css).toMatch(/:is\(\.sw-chip:has\( ?> \.sw-chip-input:checked\),\s*\.sw-chip\[data-selected\]\)\s*\{[^}]*background-color:\s*var\(--accent-subtle\)/);
    expect(css).toMatch(/:is\(\.sw-chip:has\( ?> \.sw-chip-input:checked\),\s*\.sw-chip\[data-selected\]\) \.sw-chip-check\s*\{[^}]*display:\s*block/);
  });

  it("draw the check with physical borders, so it stays a tick in right-to-left text", () => {
    const r = rule(".sw-chip-check");
    // Lightning CSS drops `currentColor`, the default border colour.
    expect(r).toMatch(/border-left:\s*1\.5px solid(?: currentcolor)?;/i);
    expect(r).toMatch(/border-bottom:\s*1\.5px solid(?: currentcolor)?;/i);
    expect(r).not.toMatch(/border-inline-start/);
    expect(r).toMatch(/transform:\s*rotate\(-45deg\)/);
  });

  it("show the focus ring on the chip for both routes", () => {
    expect(css).toMatch(/:is\(\.sw-chip:has\( ?> \.sw-chip-input:focus-visible\),\s*\.sw-chip\[data-focus-visible\]\)\s*\{[^}]*outline:\s*var\(--focus-width\) solid var\(--accent\)/);
  });
});

describe("segmented control", () => {
  it("stays as wide as its segments inside a field's grid", () => {
    expect(rule(".sw-segmented-list")).toMatch(/justify-self:\s*start/);
  });

  it("joins the segments inside one border", () => {
    expect(rule(".sw-segmented-list")).toMatch(/border:\s*1px solid var\(--border-strong\)/);
    expect(css).toMatch(/\.sw-segment \+ \.sw-segment\s*\{[^}]*border-inline-start:\s*1px solid var\(--border-strong\)/);
  });

  it("gives each segment a 40px control with a 44px hit area", () => {
    expect(rule(".sw-segment")).toMatch(/min-block-size:\s*var\(--control-height\)/);
    expect(css).toMatch(/\.sw-segment::?before\s*\{[^}]*inset-block:\s*calc\(\(var\(--control-height\) - var\(--target-min\)\) \/ 2\)/);
  });

  it("marks the selected segment like a pressed toggle: inset accent line and underline", () => {
    // Lightning CSS prints `:has(> x)` as `:has( > x)`, hence the optional space.
    const sel = /:is\(\.sw-segment:has\( ?> \.sw-segment-input:checked\),\s*\.sw-segment\[data-selected\]\)\s*\{([^}]*)\}/;
    const body = css.match(sel)?.[1] ?? "";
    expect(body).toMatch(/box-shadow:\s*inset 0 0 0 1px var\(--accent\)/);
    expect(body).toMatch(/text-decoration-line:\s*underline/);
  });
});

describe("search field", () => {
  it("reserves room for the clear button inside the input and hides the browser's own", () => {
    expect(rule(".sw-search-input")).toMatch(/padding-inline-end:\s*var\(--control-height\)/);
    // Lightning CSS prints the grouped selector on one line, so allow the rest of the group before `{`.
    expect(css).toMatch(/\.sw-search-input::-webkit-search-cancel-button(?:,[^{]*)?\s*\{[^}]*display:\s*none/);
  });

  it("places a square clear button at the inline end", () => {
    const r = rule(".sw-search-clear");
    expect(r).toMatch(/position:\s*absolute/);
    expect(r).toMatch(/inset-inline-end:\s*0/);
    expect(r).toMatch(/inline-size:\s*var\(--control-height\)/);
  });

  it("hides the clear button while the field is empty, on both routes", () => {
    // Lightning CSS prints `:has(> x)` as `:has( > x)`, hence the optional space.
    expect(css).toMatch(
      /\.sw-search\[data-empty\] \.sw-search-clear,\s*\.sw-search-control:has\( ?> \.sw-search-input:placeholder-shown\) \.sw-search-clear\s*\{[^}]*display:\s*none/,
    );
  });
});

describe("number field", () => {
  it("sets the value in tabular figures, centred", () => {
    const r = rule(".sw-number-input");
    expect(r).toMatch(/font-variant-numeric:\s*tabular-nums/);
    expect(r).toMatch(/text-align:\s*center/);
  });

  it("gives the steppers a 44px-wide control with a 44px-tall hit area", () => {
    const r = rule(".sw-number-step");
    expect(r).toMatch(/inline-size:\s*var\(--target-min\)/);
    expect(r).toMatch(/border:\s*1px solid var\(--border-strong\)/);
    expect(css).toMatch(/\.sw-number-step::?before\s*\{[^}]*inset-block:\s*calc\(\(var\(--control-height\) - var\(--target-min\)\) \/ 2\)/);
  });

  it("draws plus and minus with borders, so they survive forced colours", () => {
    expect(css).toMatch(/\.sw-number-sign::?before,\s*\.sw-number-sign\[data-sign="?plus"?\]::?after\s*\{[^}]*border-block-start:\s*1\.5px solid/);
  });
});

describe("slider", () => {
  it("draws a 2px track on both routes", () => {
    expect(css).toMatch(/\.sw-slider-input::-webkit-slider-runnable-track\s*\{[^}]*block-size:\s*2px/);
    expect(css).toMatch(/\.sw-slider-input::-moz-range-track\s*\{[^}]*block-size:\s*2px/);
    expect(css).toMatch(/\.sw-slider-track::?before\s*\{[^}]*block-size:\s*2px/);
  });

  it("uses a square thumb with the theme radius on both routes", () => {
    expect(css).toMatch(/\.sw-slider-input::-webkit-slider-thumb\s*\{[^}]*border-radius:\s*var\(--radius\)/);
    expect(rule(".sw-slider-thumb")).toMatch(/border-radius:\s*var\(--radius\)/);
  });

  it("insets the React track by half a thumb so thumbs travel like native ones", () => {
    expect(rule(".sw-slider-track")).toMatch(/margin-inline:\s*calc\(var\(--_thumb\) \/ 2\)/);
  });

  it("keeps the thumb visible in forced colours", () => {
    // Lightning CSS lowercases system colours (`Highlight` prints as `highlight`), hence /i.
    expect(css).toMatch(/@media \(forced-colors: active\)\s*\{[\s\S]*?\.sw-slider-thumb\s*\{[^}]*background-color:\s*Highlight/i);
  });

  it("keeps the native track and thumb visible in forced colours, which drop their backgrounds", () => {
    // Lightning CSS lowercases system colours (`CanvasText` prints as `canvastext`), hence /i.
    const forced = (pseudo: string, colour: string) =>
      new RegExp(
        `@media \\(forced-colors: active\\)\\s*\\{[\\s\\S]*?\\.sw-slider-input::${pseudo}\\s*\\{[^}]*forced-color-adjust:\\s*none[^}]*background-color:\\s*${colour}`,
        "i",
      );
    expect(css).toMatch(forced("-webkit-slider-runnable-track", "CanvasText"));
    expect(css).toMatch(forced("-moz-range-track", "CanvasText"));
    expect(css).toMatch(forced("-webkit-slider-thumb", "Highlight"));
    expect(css).toMatch(forced("-moz-range-thumb", "Highlight"));
  });
});

describe("progress bar and meter", () => {
  it("keeps the meter word with its dot when the value wraps", () => {
    expect(rule(".sw-meter-word")).toMatch(/white-space:\s*nowrap/);
  });

  it("moves a long value onto its own line instead of breaking it", () => {
    expect(rule(".sw-progress-head")).toMatch(/flex-wrap:\s*wrap/);
    expect(rule(".sw-progress-value")).toMatch(/margin-inline-start:\s*auto/);
  });

  it("draw a 4px bar with the browser's appearance removed", () => {
    expect(css).toMatch(/\.sw-progress-bar,\s*\.sw-meter-bar\s*\{[^}]*appearance:\s*none[^}]*block-size:\s*4px/);
  });

  it("fill the progress value with the accent in every engine", () => {
    expect(css).toMatch(/\.sw-progress-bar::-webkit-progress-value\s*\{[^}]*background-color:\s*var\(--accent\)/);
    expect(css).toMatch(/\.sw-progress-bar::-moz-progress-bar\s*\{[^}]*background-color:\s*var\(--accent\)/);
  });

  it("colour the meter by data-state, not by vendor pseudo-classes", () => {
    expect(rule('.sw-meter-bar[data-state="optimum"]')).toMatch(/--_meter-fill:\s*var\(--success\)/);
    expect(rule('.sw-meter-bar[data-state="suboptimum"]')).toMatch(/--_meter-fill:\s*var\(--warning\)/);
    expect(rule('.sw-meter-bar[data-state="poor"]')).toMatch(/--_meter-fill:\s*var\(--danger\)/);
    expect(css).not.toMatch(/-moz-meter-(optimum|sub)/);
  });

  it("keep bars visible in forced colours", () => {
    expect(css).toMatch(/@media \(forced-colors: active\)\s*\{[\s\S]*?\.sw-progress-bar::-webkit-progress-value[\s\S]*?background-color:\s*highlight/i);
    expect(css).toMatch(/@media \(forced-colors: active\)\s*\{[\s\S]*?\.sw-meter-bar::-moz-meter-bar[\s\S]*?background-color:\s*highlight/i);
  });
});

describe("skeleton", () => {
  it("is a static block on the subtle surface that pulses only with full motion", () => {
    expect(rule(".sw-skeleton")).toMatch(/background-color:\s*var\(--surface-subtle\)/);
    expect(rule(".sw-skeleton")).toMatch(/animation:\s*sw-skeleton-pulse/);
    expect(css).toMatch(/\[data-motion="?reduce"?\] \.sw-skeleton\s*\{[^}]*animation:\s*none/);
    expect(css).not.toMatch(/\.sw-skeleton[^{]*\{[^}]*gradient/);
  });

  it("stays visible in forced colours", () => {
    expect(css).toMatch(/@media \(forced-colors: active\)\s*\{[\s\S]*?\.sw-skeleton\s*\{[^}]*border:\s*1px solid canvastext/i);
  });
});

describe("banner", () => {
  it("is a full-width strip with a 4px leading rule in the tone colour", () => {
    expect(rule(".sw-banner")).toMatch(/border-inline-start:\s*4px solid var\(--_tone\)/);
    expect(rule('.sw-banner[data-tone="danger"]')).toMatch(/--_tone:\s*var\(--danger\)/);
  });

  it("aligns its content with the page's content width", () => {
    expect(rule(".sw-banner-inner")).toMatch(/max-inline-size:\s*calc\(var\(--content-max\) \+ 2 \* var\(--page-margin\)\)/);
  });

  it("moves the dismiss button under the text when the banner is narrow", () => {
    expect(rule(".sw-banner")).toMatch(/container:\s*sw-banner \/ inline-size/);
    expect(css).toMatch(/@container sw-banner \(width < 480px\)\s*\{[\s\S]*?\.sw-banner-dismiss\s*\{[^}]*grid-column:\s*2/);
  });
});

describe("empty state", () => {
  it("hangs its label in a narrow column once its container is 600px wide", () => {
    // Lightning CSS prints (min-width: 600px) in range syntax, as (width >= 600px).
    expect(css).toMatch(/@container \(width >= 600px\)\s*\{[\s\S]*?\.sw-empty\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\) minmax\(0,\s*3fr\)/);
  });

  it("caps its text at the reading measure", () => {
    expect(rule(".sw-empty-text")).toMatch(/max-inline-size:\s*66ch/);
  });
});

describe("media", () => {
  it("frames media at a fixed ratio so the page does not shift as it loads", () => {
    expect(rule(".sw-media-frame")).toMatch(/aspect-ratio:\s*var\(--_ratio,\s*16 \/ 9\)/);
    expect(rule('.sw-media[data-ratio="4:3"]')).toMatch(/--_ratio:\s*4 \/ 3/);
    expect(rule('.sw-media[data-ratio="21:9"]')).toMatch(/--_ratio:\s*21 \/ 9/);
  });

  it("covers the frame with the image, video or drawing", () => {
    expect(css).toMatch(/\.sw-media-frame > :is\(img,\s*video,\s*svg,\s*iframe\)\s*\{[^}]*object-fit:\s*cover/);
  });
});

describe("avatar and badge", () => {
  it("draws the avatar square with the theme radius, never a circle", () => {
    const r = rule(".sw-avatar");
    expect(r).toMatch(/border-radius:\s*var\(--radius\)/);
    expect(r).toMatch(/font-family:\s*var\(--font-mono\)/);
    expect(rule('.sw-avatar[data-size="lg"]')).toMatch(/--_size:\s*3\.5rem/);
  });

  it("sets badges in tabular mono figures with the theme radius", () => {
    const r = rule(".sw-badge");
    expect(r).toMatch(/border-radius:\s*var\(--radius\)/);
    expect(r).toMatch(/font-variant-numeric:\s*tabular-nums/);
    expect(rule('.sw-badge[data-tone="danger"]')).toMatch(/background-color:\s*var\(--danger\)/);
  });

  it("keeps avatars and badges outlined in forced colours", () => {
    expect(css).toMatch(/@media \(forced-colors: active\)\s*\{[\s\S]*?\.sw-avatar,\s*\.sw-badge\s*\{[^}]*border:\s*1px solid canvastext/i);
  });
});

describe("description list and stat", () => {
  it("lays out facts as hairline-topped cells with mono terms", () => {
    expect(rule(".sw-dl-item")).toMatch(/border-block-start:\s*1px solid var\(--border\)/);
    expect(rule(".sw-dl dt")).toMatch(/font-family:\s*var\(--font-mono\)/);
  });

  it("sets the stat value large and light over a signal rule", () => {
    expect(rule(".sw-stat")).toMatch(/border-block-start:\s*2px solid var\(--brand-signal\)/);
    const value = rule(".sw-stat-value");
    expect(value).toMatch(/font-size:\s*var\(--text-h1-size\)/);
    expect(value).toMatch(/font-weight:\s*300/);
  });

  it("keeps the change neutral in colour and mirrors its arrow in RTL", () => {
    expect(rule(".sw-stat-change")).toMatch(/color:\s*var\(--text-secondary\)/);
    expect(css).toMatch(/\.sw-stat-change svg:dir\(rtl\)\s*\{[^}]*transform:\s*scaleX\(-1\)/);
  });
});

describe("combobox", () => {
  it("reserves room for the suggestions button inside the input", () => {
    expect(rule(".sw-combobox-input")).toMatch(/padding-inline-end:\s*var\(--control-height\)/);
  });

  it("places a square suggestions button at the inline end", () => {
    const r = rule(".sw-combobox-button");
    expect(r).toMatch(/position:\s*absolute/);
    expect(r).toMatch(/inset-inline-end:\s*0/);
    expect(r).toMatch(/inline-size:\s*var\(--control-height\)/);
  });

  it("extends the button's hit area to the 44px target", () => {
    expect(rule(".sw-combobox-button:before")).toMatch(/inset-block:\s*calc\(\(var\(--control-height\) - var\(--target-min\)\) \/ 2\)/);
  });

  it("gives the native list input back its normal padding, since the browser draws its own indicator", () => {
    expect(rule(".sw-combobox-input[list]")).toMatch(/padding-inline-end:\s*var\(--space-3\)/);
  });
});

describe("calendar", () => {
  it("is at most seven 44px cells wide", () => {
    expect(rule(".sw-calendar")).toMatch(/inline-size:\s*min\(100%,\s*calc\(7 \* var\(--target-min\)\)\)/);
  });

  it("draws square day cells in mono", () => {
    const r = rule(".sw-calendar-cell");
    expect(r).toMatch(/aspect-ratio:\s*1/);
    expect(r).toMatch(/font-family:\s*var\(--font-mono\)/);
  });

  it("marks today with a 2px underline, not colour", () => {
    const r = rule(".sw-calendar-cell[data-today]");
    expect(r).toMatch(/text-decoration-line:\s*underline/);
    expect(r).toMatch(/text-decoration-thickness:\s*2px/);
  });

  it("fills a selected day with the accent and sets it in weight 500", () => {
    const r = rule(".sw-calendar-cell[data-selected]");
    expect(r).toMatch(/background-color:\s*var\(--accent\)/);
    expect(r).toMatch(/color:\s*var\(--on-accent\)/);
    expect(r).toMatch(/font-weight:\s*500/);
  });

  it("gives the middle of a range a subtle fill, keeping the ends solid", () => {
    expect(css).toMatch(
      /\.sw-range-calendar \.sw-calendar-cell\[data-selected\]:not\(\[data-selection-start\],\s*\[data-selection-end\]\)\s*\{[^}]*background-color:\s*var\(--accent-subtle\)/,
    );
  });

  it("strikes through unavailable days and hides days outside the month", () => {
    expect(rule(".sw-calendar-cell[data-unavailable]")).toMatch(/text-decoration-line:\s*line-through/);
    expect(rule(".sw-calendar-cell[data-outside-month]")).toMatch(/visibility:\s*hidden/);
  });

  it("mirrors the month arrows in right-to-left text", () => {
    expect(css).toMatch(/\.sw-calendar-nav svg:dir\(rtl\)\s*\{[^}]*transform:\s*scaleX\(-1\)/);
  });

  it("keeps selected days visible in forced colours", () => {
    expect(css).toMatch(
      /@media \(forced-colors: active\)\s*\{[\s\S]*?\.sw-calendar-cell\[data-selected\]\s*\{[^}]*forced-color-adjust:\s*none[^}]*background-color:\s*highlight/i,
    );
  });
});

describe("date picker", () => {
  it("keeps a wide range field's two dates together, with the button at the end", () => {
    expect(rule(".sw-date-range-picker .sw-date-input")).toMatch(/flex:\s*none/);
    expect(rule(".sw-date-range-picker .sw-date-button")).toMatch(/margin-inline-start:\s*auto/);
  });

  it("stacks a narrow range field: start over end, the calendar button beside both", () => {
    expect(rule(".sw-date-range-picker")).toMatch(/container:\s*sw-date-range \/ inline-size/);
    expect(css).toMatch(
      /@container sw-date-range \(width < 18rem\)\s*\{[\s\S]*?\.sw-date-range-picker \.sw-date-field\s*\{[^}]*display:\s*grid[\s\S]*?\.sw-date-input-end\s*\{[^}]*grid-row:\s*2[\s\S]*?\.sw-date-range-dash\s*\{[^}]*display:\s*none/,
    );
  });

  it("lays the segments and the calendar button out in one input", () => {
    const r = rule(".sw-date-field");
    expect(r).toMatch(/display:\s*flex/);
    expect(r).toMatch(/padding-block:\s*0/);
    expect(r).toMatch(/padding-inline-end:\s*0/);
  });

  it("rings the whole field while a segment has keyboard focus", () => {
    expect(rule(".sw-date-field[data-focus-visible]")).toMatch(/outline:\s*var\(--focus-width\) solid var\(--accent\)/);
  });

  it("marks an invalid field with a thicker leading edge as well as colour", () => {
    const r = rule(".sw-date-field[data-invalid]");
    expect(r).toMatch(/border-color:\s*var\(--danger\)/);
    expect(r).toMatch(/border-inline-start-width:\s*4px/);
  });

  it("fills the focused segment with the accent, and keeps it visible in forced colours", () => {
    expect(rule(".sw-date-segment[data-focused]")).toMatch(/background-color:\s*var\(--accent\)/);
    expect(css).toMatch(
      /@media \(forced-colors: active\)\s*\{[\s\S]*?\.sw-date-segment\[data-focused\]\s*\{[^}]*forced-color-adjust:\s*none[^}]*background-color:\s*highlight/i,
    );
  });

  it("widens one-digit segments so neighbouring targets sit 24px apart", () => {
    expect(css).toMatch(/\.sw-date-segment:not\(\[data-type="?literal"?\]\)\s*\{[^}]*min-inline-size:\s*1\.125rem/);
  });

  it("puts the calendar button behind a hairline at the inline end", () => {
    const r = rule(".sw-date-button");
    expect(r).toMatch(/inline-size:\s*var\(--control-height\)/);
    expect(r).toMatch(/border-inline-start:\s*1px solid var\(--border\)/);
  });

  it("sets a native date range as two fields side by side that wrap", () => {
    expect(rule(".sw-date-range-fields")).toMatch(/flex-wrap:\s*wrap/);
    expect(rule(".sw-date-range-native")).toMatch(/border:\s*0/);
  });

  it("aligns the native range's legend with its fields and spaces it like a field label", () => {
    // A rendered legend is not a grid item, so .sw-field's gap misses it, and browsers pad it 2px.
    const r = rule(".sw-date-range-native > legend");
    expect(r).toMatch(/padding:\s*0/);
    expect(r).toMatch(/margin-block-end:\s*var\(--space-2\)/);
  });
});

describe("file upload", () => {
  it("draws the drop zone with a dashed hairline", () => {
    expect(rule(".sw-file-drop")).toMatch(/border:\s*1px dashed var\(--border-strong\)/);
  });

  it("shows a drag-over by a solid border and a fill, not colour alone", () => {
    const r = rule(".sw-file-drop[data-drop-target]");
    expect(r).toMatch(/border-style:\s*solid/);
    expect(r).toMatch(/background-color:\s*var\(--accent-subtle\)/);
  });

  it("makes the native file input itself the drop zone", () => {
    const r = rule(".sw-file-input");
    expect(r).toMatch(/inline-size:\s*100%/);
    expect(r).toMatch(/border:\s*1px dashed var\(--border-strong\)/);
  });

  it("styles the native choose button as a Raster button", () => {
    // Lightning CSS may also print a -webkit-file-upload-button copy; the standard one must exist.
    expect(css).toMatch(/\.sw-file-input::file-selector-button\s*\{[^}]*border:\s*1px solid var\(--border-strong\)/);
  });

  it("lists files between hairlines, with the size in mono", () => {
    expect(rule(".sw-file-item")).toMatch(/border-block-end:\s*1px solid var\(--border\)/);
    expect(rule(".sw-file-size")).toMatch(/font-family:\s*var\(--font-mono\)/);
    expect(rule(".sw-file-name")).toMatch(/text-overflow:\s*ellipsis/);
  });
});
