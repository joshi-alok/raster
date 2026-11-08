import { describe, expect, it } from "vitest";
import { validate } from "../src/demos/patterns/EnquiryForm";
import { matching, PROJECTS } from "../src/demos/patterns/NoMatches";

describe("the enquiry form's checks", () => {
  it("asks for a name and a complete email address", () => {
    expect(validate({ name: " ", email: "studio@" })).toEqual({
      name: "Enter your name.",
      email: "Enter an email address such as name@studio.ch.",
    });
  });

  it("passes a complete enquiry", () => {
    expect(validate({ name: "Anna Keller", email: "anna@studio.ch" })).toEqual({});
  });
});

describe("the project search", () => {
  it("matches names case-insensitively, ignoring spaces at the ends", () => {
    expect(matching(" museum ")).toEqual(["Museum wayfinding"]);
  });

  it("lists everything for an empty query, and nothing for a query that matches nothing", () => {
    expect(matching("")).toEqual(PROJECTS);
    expect(matching("zeppelin")).toEqual([]);
  });
});
