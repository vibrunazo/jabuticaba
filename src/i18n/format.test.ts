import { describe, expect, it } from "vitest";
import { formatNumber, formatPartialDate, formatRange, languageName, placeName } from "./format.ts";

describe("formatNumber", () => {
  it("uses the locale's decimal separator", () => {
    expect(formatNumber("pt", 0.4616)).toBe("0,46");
    expect(formatNumber("en", 0.4616)).toBe("0.46");
    expect(formatNumber("pt", 10.5, 1)).toBe("10,5");
  });
});

describe("formatRange", () => {
  it("collapses equal ends", () => {
    expect(formatRange("pt", 0.44, 0.48)).toBe("0,44–0,48");
    expect(formatRange("en", 3, 3)).toBe("3");
  });
});

describe("formatPartialDate", () => {
  it("formats only the parts that exist", () => {
    expect(formatPartialDate("en", "2024")).toBe("2024");
    expect(formatPartialDate("en", "2024-06")).toBe("Jun 2024");
    expect(formatPartialDate("en", "2026-09-25")).toBe("Sep 25, 2026");
    expect(formatPartialDate("pt", "2026-09-25")).toMatch(/25.*set.*2026/);
  });
});

describe("names", () => {
  it("translates place and language names", () => {
    expect(placeName("pt", "FR")).toBe("França");
    expect(placeName("en", "GF")).toBe("French Guiana");
    expect(languageName("pt", "es")).toBe("espanhol");
    expect(languageName("en", "pt")).toBe("Portuguese");
  });
});
