/**
 * Invoker commands (`commandfor` / `command`) for browsers released before December 2025.
 * Handles `show-modal` and `close` on dialogs, which is all the docs site uses. Keep the
 * logic in step with the `invokerFallback` sample in src/content/components/header.mdx.
 * Returns a function that removes the listener; a no-op where the browser already supports it.
 */
export function installInvokerFallback(doc: Document): () => void {
  const view = doc.defaultView;
  if (!view || "command" in view.HTMLButtonElement.prototype)
    return () => undefined;
  const onClick = (event: Event) => {
    const button =
      event.target instanceof view.Element
        ? event.target.closest("button[commandfor]")
        : null;
    const target =
      button && doc.getElementById(button.getAttribute("commandfor") ?? "");
    if (!button || !(target instanceof view.HTMLDialogElement)) return;
    const command = button.getAttribute("command");
    if (command === "show-modal") target.showModal();
    else if (command === "close") target.close();
  };
  doc.addEventListener("click", onClick);
  return () => doc.removeEventListener("click", onClick);
}
