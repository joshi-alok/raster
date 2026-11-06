// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { installSearchClear, installSliderOutputs } from "../src/lib/native-controls";

let uninstall: () => void = () => undefined;
afterEach(() => {
  uninstall();
  document.body.innerHTML = "";
});

describe("installSearchClear", () => {
  it("empties the search input, announces the change and returns focus", () => {
    document.body.innerHTML = `
      <div class="sw-search-control">
        <input type="search" id="q" value="Linie" />
        <button type="button" class="sw-search-clear"><span class="sw-search-clear-icon"></span></button>
      </div>`;
    uninstall = installSearchClear(document);
    const input = document.getElementById("q") as HTMLInputElement;
    let inputEvents = 0;
    input.addEventListener("input", () => inputEvents++);
    (document.querySelector(".sw-search-clear-icon") as HTMLElement).click();
    expect(input.value).toBe("");
    expect(inputEvents).toBe(1);
    expect(document.activeElement).toBe(input);
  });

  it("leaves React Aria's clear buttons alone", () => {
    document.body.innerHTML = `
      <div class="sw-search-control">
        <input type="search" id="q" value="Linie" />
        <button type="button" class="sw-search-clear" data-rac=""></button>
      </div>`;
    uninstall = installSearchClear(document);
    (document.querySelector(".sw-search-clear") as HTMLElement).click();
    expect((document.getElementById("q") as HTMLInputElement).value).toBe("Linie");
  });
});

describe("installSearchClear, Escape", () => {
  const press = (target: Element) => {
    const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    target.dispatchEvent(event);
    return event;
  };

  it("clears a filled native search field and announces the change", () => {
    document.body.innerHTML = `
      <div class="sw-search-control">
        <input type="search" id="q" value="Linie" />
        <button type="button" class="sw-search-clear" tabindex="-1"></button>
      </div>`;
    uninstall = installSearchClear(document);
    const input = document.getElementById("q") as HTMLInputElement;
    let inputEvents = 0;
    document.addEventListener("input", () => inputEvents++, { once: true });
    const event = press(input);
    expect(input.value).toBe("");
    expect(inputEvents).toBe(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it("leaves an empty field, and its Escape, alone", () => {
    document.body.innerHTML = `
      <div class="sw-search-control"><input type="search" id="q" value="" /></div>`;
    uninstall = installSearchClear(document);
    const input = document.getElementById("q") as HTMLInputElement;
    let inputEvents = 0;
    input.addEventListener("input", () => inputEvents++);
    const event = press(input);
    expect(inputEvents).toBe(0);
    expect(event.defaultPrevented).toBe(false);
  });

  it("ignores React Aria's search inputs, which clear themselves", () => {
    document.body.innerHTML = `
      <div class="sw-search" data-rac="">
        <div class="sw-search-control"><input type="search" id="a" value="Linie" /></div>
      </div>
      <div class="sw-search-control"><input type="search" id="b" value="Linie" data-rac="" /></div>`;
    uninstall = installSearchClear(document);
    for (const id of ["a", "b"]) {
      const input = document.getElementById(id) as HTMLInputElement;
      const event = press(input);
      expect(input.value).toBe("Linie");
      expect(event.defaultPrevented).toBe(false);
    }
  });

  it("ignores search inputs outside a Raster search control", () => {
    document.body.innerHTML = `<input type="search" id="q" value="Linie" />`;
    uninstall = installSearchClear(document);
    const input = document.getElementById("q") as HTMLInputElement;
    press(input);
    expect(input.value).toBe("Linie");
  });
});

describe("installSliderOutputs", () => {
  it("keeps each output in step with the range input it names", () => {
    document.body.innerHTML = `
      <input type="range" id="gutter" min="16" max="32" value="24" />
      <output for="gutter">24</output>`;
    uninstall = installSliderOutputs(document);
    const input = document.getElementById("gutter") as HTMLInputElement;
    input.value = "30";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(document.querySelector("output")?.value).toBe("30");
  });
});
