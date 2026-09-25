import { describe, expect, it } from "vitest";
import { EXPORT_WEIGHT_FACTOR, MAX_INTENSITY_CREDIT } from "../scoring/constants.ts";
import { fillPlaceholders, placeholderValues } from "./placeholders.ts";

describe("fillPlaceholders", () => {
  it("replaces known placeholders and reports unknown ones", () => {
    const result = fillPlaceholders("<p>{{A}} and {{ B }} and {{MISSING}}</p>", { A: "1", B: "2" });
    expect(result.html).toBe("<p>1 and 2 and {{MISSING}}</p>");
    expect(result.unknown).toEqual(["MISSING"]);
  });
});

describe("placeholderValues", () => {
  it("formats constants for the locale", () => {
    const pt = placeholderValues("pt");
    const en = placeholderValues("en");
    expect(pt.EXPORT_WEIGHT_FACTOR).toBe(String(EXPORT_WEIGHT_FACTOR).replace(".", ","));
    expect(en.EXPORT_WEIGHT_FACTOR).toBe(String(EXPORT_WEIGHT_FACTOR));
    expect(en.MAX_INTENSITY_CREDIT).toBe(String(MAX_INTENSITY_CREDIT));
  });

  it("derives the ubiquitous-item ceiling from the formula", () => {
    expect(placeholderValues("en").UBIQUITOUS_MAX_SCORE).toBe(String(100 * MAX_INTENSITY_CREDIT));
  });

  it("defines no empty values", () => {
    for (const value of Object.values(placeholderValues("pt"))) {
      expect(value).not.toBe("");
      expect(value).not.toBe("NaN");
    }
  });
});
