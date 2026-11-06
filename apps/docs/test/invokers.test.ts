// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installInvokerFallback } from "../src/lib/invokers";

const proto = HTMLDialogElement.prototype as unknown as Record<string, unknown>;
const original = { showModal: proto.showModal, close: proto.close };
let hadCommand = false;
let commandDescriptor: PropertyDescriptor | undefined;

beforeEach(() => {
  // Simulate a browser without invoker commands, whatever jsdom ships.
  commandDescriptor = Object.getOwnPropertyDescriptor(
    HTMLButtonElement.prototype,
    "command",
  );
  hadCommand = commandDescriptor !== undefined;
  if (hadCommand)
    delete (HTMLButtonElement.prototype as unknown as Record<string, unknown>)
      .command;
  // jsdom may lack showModal; stub both on the prototype so the calls are observable.
  proto.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  });
  proto.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  });
  document.body.innerHTML = `
    <button type="button" id="open" commandfor="menu" command="show-modal"><span>Menu</span></button>
    <dialog id="menu"><button type="button" id="close" commandfor="menu" command="close">Close</button></dialog>
    <div id="not-a-dialog"></div>
    <button type="button" id="wrong" commandfor="not-a-dialog" command="show-modal">Wrong</button>`;
});

afterEach(() => {
  proto.showModal = original.showModal;
  proto.close = original.close;
  if (hadCommand && commandDescriptor)
    Object.defineProperty(
      HTMLButtonElement.prototype,
      "command",
      commandDescriptor,
    );
  document.body.innerHTML = "";
});

function click(id: string) {
  document.getElementById(id)!.click();
}

describe("installInvokerFallback", () => {
  it("opens a dialog as a modal from a show-modal invoker, including clicks on its children", () => {
    const uninstall = installInvokerFallback(document);
    document.querySelector<HTMLElement>("#open span")!.click();
    expect(proto.showModal).toHaveBeenCalledTimes(1);
    expect(document.getElementById("menu")!.hasAttribute("open")).toBe(true);
    uninstall();
  });

  it("closes a dialog from a close invoker", () => {
    const uninstall = installInvokerFallback(document);
    click("open");
    click("close");
    expect(proto.close).toHaveBeenCalledTimes(1);
    expect(document.getElementById("menu")!.hasAttribute("open")).toBe(false);
    uninstall();
  });

  it("ignores invokers whose target is not a dialog", () => {
    const uninstall = installInvokerFallback(document);
    click("wrong");
    expect(proto.showModal).not.toHaveBeenCalled();
    uninstall();
  });

  it("does nothing when the browser supports invoker commands", () => {
    Object.defineProperty(HTMLButtonElement.prototype, "command", {
      configurable: true,
      get: () => "",
    });
    try {
      const uninstall = installInvokerFallback(document);
      click("open");
      expect(proto.showModal).not.toHaveBeenCalled();
      uninstall();
    } finally {
      delete (HTMLButtonElement.prototype as unknown as Record<string, unknown>)
        .command;
    }
  });
});
