import { describe, expect, it } from "vitest";
import { checkButtonLabel, checkCopy, checkSentenceCase } from "../src/lib/content-style";

const rules = (issues: { rule: string }[]) => issues.map((i) => i.rule);
const NAMES = new Set(["DataGrid", "Select"]);

describe("checkCopy", () => {
  it("passes plain copy", () => {
    expect(checkCopy("Two pages could not be published. Check the build log and try again.")).toEqual([]);
  });

  it("flags exclamation marks, click here, an Error prefix and three dots", () => {
    expect(rules(checkCopy("Saved!"))).toEqual(["exclamation"]);
    expect(rules(checkCopy("To read the guide, click here."))).toEqual(["click-here"]);
    expect(rules(checkCopy("Error: the file is too large."))).toEqual(["error-prefix"]);
    expect(rules(checkCopy("Loading..."))).toEqual(["ellipsis"]);
  });

  it("flags American spellings, and names the British one", () => {
    expect(checkCopy("Pick a color and center it.")).toEqual([
      { rule: "spelling", detail: 'color: write "colour"' },
      { rule: "spelling", detail: 'center: write "centre"' },
    ]);
  });

  it("ignores code", () => {
    expect(checkCopy("Set `color` to `currentColor`, without `!important`.")).toEqual([]);
  });
});

describe("checkSentenceCase", () => {
  it("passes sentence case, proper nouns, component names, acronyms and quoted text", () => {
    expect(checkSentenceCase("Use a DataGrid in Zürich for CSV files", NAMES)).toEqual([]);
    expect(checkSentenceCase('Confirm the result, such as "Saved" or "Sent".', NAMES)).toEqual([]);
    expect(checkSentenceCase("Fix the field. Then send it again.", NAMES)).toEqual([]);
  });

  it("flags title case", () => {
    expect(checkSentenceCase("Project Enquiry Form", NAMES)).toEqual([
      { rule: "sentence-case", detail: '"Enquiry" in "Project Enquiry Form"' },
      { rule: "sentence-case", detail: '"Form" in "Project Enquiry Form"' },
    ]);
  });
});

describe("checkButtonLabel", () => {
  it("flags labels that do not name the outcome", () => {
    expect(rules(checkButtonLabel("OK"))).toEqual(["generic-label"]);
    expect(rules(checkButtonLabel("Submit"))).toEqual(["generic-label"]);
    expect(checkButtonLabel("Send enquiry")).toEqual([]);
  });
});
