import { describe, expect, it } from "vitest";
import { validate } from "../src/demos/patterns/EnquiryForm";

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
