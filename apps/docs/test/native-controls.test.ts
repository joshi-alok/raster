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
