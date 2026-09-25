import { describe, expect, it } from "vitest";
import { makeItem, makeLocaleText, makePresence, makeSource } from "../testing/make-item.ts";
import { buildItemDetail, type ItemDetailInput, numberSources } from "./item-detail.ts";
import type { ItemText } from "./ranking.ts";

const capybara = makeItem({
  id: "capybara",
  presence: [
    makePresence("AR", "regional", ["survey"]),
    makePresence("GF", "widespread", ["survey"]),
    makePresence("US", ["absent", "marginal"], ["gazette"]),
  ],
  intensity: { value: 2, sources: ["census"] },
  sources: [
    makeSource({ id: "census" }),
    makeSource({ id: "survey" }),
    makeSource({ id: "gazette" }),
    makeSource({ id: "unused" }),
  ],
  related: ["mutt"],
});
const mutt = makeItem({ id: "mutt", related: ["capybara"] });
const lonely = makeItem({ id: "lonely", related: ["capybara"] });

const texts: ItemText[] = [
  {
    itemId: "capybara",
    locale: "pt",
    text: makeLocaleText({
      slug: "capivara",
      title: "Capivara",
      presenceNotes: { US: "Fugidas." },
    }),
    body: "Texto [@gazette]. Mais [@census].",
  },
  {
    itemId: "capybara",
    locale: "en",
    text: makeLocaleText({ slug: "capybara", title: "Capybara", translationStatus: "machine" }),
    body: "Text [@census].",
  },
  {
    itemId: "mutt",
    locale: "pt",
    text: makeLocaleText({ slug: "vira-lata", title: "Vira-lata" }),
    body: "",
  },
];

const input: ItemDetailInput = {
  item: capybara,
  locale: "pt",
  visibleItems: [capybara, mutt, lonely],
  texts,
  places: [{ code: "AR" }, { code: "FR" }, { code: "GF", sovereign: "FR" }, { code: "US" }],
  subdivisions: new Map(),
};

describe("numberSources", () => {
  it("numbers body citations first, then input sources, then the rest", () => {
    const ids = numberSources(capybara, "A [@gazette]. B [@census].").map((s) => [
      s.number,
      s.source.id,
    ]);
    expect(ids).toEqual([
      [1, "gazette"],
      [2, "census"],
      [3, "survey"],
      [4, "unused"],
    ]);
  });
});

describe("buildItemDetail", () => {
  const detail = buildItemDetail(input);

  it("uses the requested locale's text and links every translation", () => {
    expect(detail?.text.title).toBe("Capivara");
    expect(detail?.alternates).toEqual({ pt: "/capivara/", en: "/en/capybara/" });
  });

  it("returns undefined when the locale has no text", () => {
    expect(buildItemDetail({ ...input, item: lonely })).toBeUndefined();
  });

  it("sorts presence by level and names territories with their sovereign state", () => {
    const rows = detail?.presence.map((r) => [r.place, r.name, r.sovereignName]);
    expect(rows).toEqual([
      ["GF", "Guiana Francesa", "França"],
      ["AR", "Argentina", undefined],
      ["US", "Estados Unidos", undefined],
    ]);
    expect(detail?.presence.find((r) => r.place === "US")).toMatchObject({
      low: "absent",
      high: "marginal",
      note: "Fugidas.",
      sourceNumbers: [1],
    });
  });

  it("refers to sources by their numbers", () => {
    expect(detail?.intensity).toEqual({ sourceNumbers: [2], editorial: false });
    expect(detail?.awareness.editorial).toBe(true);
  });

  it("merges related items and backlinks, falling back to the default locale", () => {
    expect(detail?.related.map((r) => r.id)).toEqual(["mutt"]);
    const en = buildItemDetail({ ...input, locale: "en" });
    expect(en?.related).toEqual([
      { id: "mutt", title: "Vira-lata", href: "/vira-lata/", lang: "pt" },
    ]);
  });

  it("ranks the item among the visible items", () => {
    expect(detail?.total).toBe(3);
    expect(detail?.rank).toBeGreaterThanOrEqual(1);
  });
});
