/**
 * Optional scripts for Raster's native route. Each returns a function that removes its listener.
 */

/**
 * Search fields: the clear button empties its input, tells listeners, and returns focus to it;
 * Escape empties a filled input too, which Chromium and Safari do for type=search but Firefox may not.
 */
export function installSearchClear(doc: Document): () => void {
  const clear = (input: HTMLInputElement) => {
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  };
  const onClick = (event: Event) => {
    const button = event.target instanceof Element ? event.target.closest(".sw-search-clear") : null;
    // React Aria's SearchField clears itself; its button carries data-rac.
    if (!button || button.hasAttribute("data-rac")) return;
    const input = button.parentElement?.querySelector<HTMLInputElement>('input[type="search"]');
    if (!input) return;
    clear(input);
    input.focus();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.type !== "search" || !input.closest(".sw-search-control")) return;
    // React Aria's inputs carry data-rac, as do the fields around them.
    if (input.closest("[data-rac]")) return;
    if (input.value === "") return;
    clear(input);
    event.preventDefault();
  };
  doc.addEventListener("click", onClick);
  doc.addEventListener("keydown", onKeyDown);
  return () => {
    doc.removeEventListener("click", onClick);
    doc.removeEventListener("keydown", onKeyDown);
  };
}

/** Sliders: keep every <output for="id"> in step with the range input of that id. */
export function installSliderOutputs(doc: Document): () => void {
  const onInput = (event: Event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.type !== "range" || !input.id) return;
    for (const output of doc.querySelectorAll("output")) {
      if (output.htmlFor.contains(input.id)) output.value = input.value;
    }
  };
  doc.addEventListener("input", onInput);
  return () => doc.removeEventListener("input", onInput);
}

/**
 * Data grids: a header checkbox with data-select-all checks or clears every enabled row checkbox in
 * its table, and shows a partial selection as indeterminate. Rows still submit as plain checkboxes.
 * The header is brought in line on install, on pageshow (restored form state) and after a form reset,
 * since none of those fire change; indeterminate cannot be written in HTML.
 */
export function installSelectAll(doc: Document): () => void {
  const parts = (table: Element) => {
    // React Aria's grids manage their own selection; their elements carry data-rac.
    if (table.closest("[data-rac]")) return null;
    const all = table.querySelector<HTMLInputElement>("thead input[data-select-all]");
    if (!all) return null;
    const rows = [...table.querySelectorAll<HTMLInputElement>('tbody input[type="checkbox"]:not(:disabled)')];
    return { all, rows };
  };
  const sync = (table: Element) => {
    const grid = parts(table);
    if (!grid) return;
    const checked = grid.rows.filter((box) => box.checked).length;
    grid.all.checked = grid.rows.length > 0 && checked === grid.rows.length;
    grid.all.indeterminate = checked > 0 && checked < grid.rows.length;
  };
  const syncAll = () => {
    for (const table of doc.querySelectorAll("table.sw-data-grid")) sync(table);
  };
  const onChange = (event: Event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.type !== "checkbox") return;
    const table = input.closest("table.sw-data-grid");
    const grid = table && parts(table);
    if (!table || !grid) return;
    if (input === grid.all) for (const box of grid.rows) box.checked = grid.all.checked;
    sync(table);
  };
  // reset fires before the form's controls are restored, so look once they have been.
  const onReset = () => setTimeout(syncAll, 0);
  const view = doc.defaultView;
  doc.addEventListener("change", onChange);
  doc.addEventListener("reset", onReset);
  view?.addEventListener("pageshow", syncAll);
  syncAll();
  return () => {
    doc.removeEventListener("change", onChange);
    doc.removeEventListener("reset", onReset);
    view?.removeEventListener("pageshow", syncAll);
  };
}
