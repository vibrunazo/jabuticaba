import { describe, expect, it } from "vitest";
import { format, locales, localizedPath, t, ui } from "./ui.ts";

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

  it("uses the same placeholders in every locale", () => {
    const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();
    for (const key of Object.keys(ui.pt) as (keyof typeof ui.pt)[]) {
      for (const locale of locales) {
        expect(placeholders(ui[locale][key]), `${locale} ${key}`).toEqual(placeholders(ui.pt[key]));
      }
    }
  });

  it("translates a key", () => {
    expect(t("en", "site.name")).toBe("Jabuticaba Index®");
  });
});

describe("format", () => {
  it("fills placeholders", () => {
    expect(format("en", "ranking.scoreLabel", { score: 56, low: 51, high: 61 })).toBe(
      "56%, plausibility range 51% to 61%",
    );
  });

  it("leaves unknown placeholders untouched", () => {
    expect(format("en", "badge.evidenceGrade", {})).toBe("Evidence {grade}");
  });
});

describe("localizedPath", () => {
  it("keeps the default locale at the root", () => {
    expect(localizedPath("pt", "/")).toBe("/");
    expect(localizedPath("en", "/")).toBe("/en/");
    expect(localizedPath("en", "/capybara/")).toBe("/en/capybara/");
  });
});
