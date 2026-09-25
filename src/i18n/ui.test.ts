import { describe, expect, it } from "vitest";
import { locales, t, ui } from "./ui.ts";

describe("ui dictionary", () => {
  it("has the same keys in every locale", () => {
    const referenceKeys = Object.keys(ui.pt).sort();
    for (const locale of locales) {
      expect(Object.keys(ui[locale]).sort()).toEqual(referenceKeys);
    }
  });

  it("has no empty strings", () => {
    for (const locale of locales) {
      for (const value of Object.values(ui[locale])) {
        expect(value.trim()).not.toBe("");
      }
    }
  });

  it("translates a key", () => {
    expect(t("en", "site.name")).toBe("Jabuticaba Index®");
  });
});
