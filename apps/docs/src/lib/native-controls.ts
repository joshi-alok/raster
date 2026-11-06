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
