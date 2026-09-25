import { describe, expect, it } from "vitest";
import { makeItem, makeLocaleText, makePresence } from "../testing/make-item.ts";
import { buildRanking, type ItemText } from "./ranking.ts";

const rare = makeItem({ id: "rare", status: "published", presence: [] });
const common = makeItem({
  id: "common",
  status: "published",
  presence: Array.from({ length: 30 }, (_, i) => makePresence(`P${i}`, "widespread")),
  awareness: { value: 0, sources: [] },
});
const mock = makeItem({ id: "mock-item", status: "mock" });

const texts: ItemText[] = [
  { itemId: "rare", locale: "pt", text: makeLocaleText({ title: "Raro", slug: "raro" }), body: "" },
  { itemId: "rare", locale: "en", text: makeLocaleText({ title: "Rare", slug: "rare" }), body: "" },
  {
    itemId: "common",
    locale: "pt",
    text: makeLocaleText({ title: "Comum", slug: "comum" }),
    body: "",
  },
  { itemId: "mock-item", locale: "pt", text: makeLocaleText({ title: "Fictício" }), body: "" },
];

describe("buildRanking", () => {
  it("ranks by score and uses the requested locale", () => {
    const rows = buildRanking([common, rare], texts, "en", { includeUnpublished: false });
    expect(rows.map((r) => [r.rank, r.id, r.title, r.href])).toEqual([
      [1, "rare", "Rare", "/en/rare/"],
      [2, "common", "Comum", "/comum/"],
    ]);
  });

  it("falls back to the default locale and flags it", () => {
    const rows = buildRanking([common], texts, "en", { includeUnpublished: false });
    expect(rows[0]?.untranslated).toBe(true);
    expect(rows[0]?.href).toBe("/comum/");
    const ptRows = buildRanking([common], texts, "pt", { includeUnpublished: false });
    expect(ptRows[0]?.untranslated).toBe(false);
  });

  it("passes the cover image and its alt text in the shown locale", () => {
    const withImage = {
      ...rare,
      image: { file: "cover.webp", credit: { author: "A", license: "CC0-1.0" } },
    };
    const imageTexts: ItemText[] = [
      {
        ...texts[0],
        text: makeLocaleText({ title: "Raro", slug: "raro", imageAlt: "Foto." }),
      } as ItemText,
    ];
    const rows = buildRanking([withImage], imageTexts, "pt", { includeUnpublished: false });
    expect(rows[0]?.image).toEqual({ file: "cover.webp", alt: "Foto." });
  });

  it("hides unpublished items unless asked", () => {
    const hidden = buildRanking([rare, mock], texts, "pt", { includeUnpublished: false });
    expect(hidden.map((r) => r.id)).toEqual(["rare"]);
    const shown = buildRanking([rare, mock], texts, "pt", { includeUnpublished: true });
    expect(shown.map((r) => r.id)).toContain("mock-item");
  });

  it("leaves out items without any text", () => {
    const orphan = makeItem({ id: "orphan", status: "published" });
    expect(buildRanking([orphan], texts, "pt", { includeUnpublished: false })).toEqual([]);
  });

  it("marks hidden jabuticabas: low awareness and a score above 50", () => {
    const hiddenRare = { ...rare, awareness: { value: 0, sources: [] } };
    const rows = buildRanking([common, hiddenRare], texts, "pt", { includeUnpublished: false });
    // Both have awareness 0, but "common" scores below 50.
    expect(rows.find((r) => r.id === "rare")?.hiddenJabuticaba).toBe(true);
    expect(rows.find((r) => r.id === "common")?.hiddenJabuticaba).toBe(false);
  });
});
