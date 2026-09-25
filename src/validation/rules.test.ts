import { describe, expect, it } from "vitest";
import type { Item } from "../schema/item.ts";
import { makeItem, makeLocaleText, makePresence, makeSource } from "../testing/make-item.ts";
import { runRules } from "./rules.ts";
import type { ContentSnapshot, ItemFolder, LocaleTextFile, ValidationOptions } from "./types.ts";

const OPTIONS: ValidationOptions = { production: false, today: "2026-09-25" };

function makeFolder(item: Item, texts?: LocaleTextFile[], extraFiles: string[] = []): ItemFolder {
  const dir = `content/jabuticabas/${item.id}`;
  const localeTexts = texts ?? [
    { locale: "pt", file: `${dir}/pt.md`, text: makeLocaleText({ slug: item.id }), body: "Texto." },
  ];
  return {
    folderName: item.id,
    dir,
    fileNames: ["item.json", ...localeTexts.map((t) => `${t.locale}.md`), ...extraFiles].sort(),
    item,
    texts: localeTexts,
  };
}

function snapshotOf(...folders: ItemFolder[]): ContentSnapshot {
  return {
    items: folders,
    places: ["AR", "BR", "PY", "US"].map((code) => ({ code })),
    subdivisions: new Map([
      ["US", [{ code: "US-LA", names: { pt: "Luisiana", en: "Louisiana" } }]],
    ]),
    mapCodes: new Set(["AR", "BR", "PY", "US"]),
  };
}

function codesFor(snapshot: ContentSnapshot, options = OPTIONS): string[] {
  return runRules(snapshot, options).map((p) => p.code);
}

describe("runRules", () => {
  it("accepts a valid mock item", () => {
    expect(runRules(snapshotOf(makeFolder(makeItem())), OPTIONS)).toEqual([]);
  });

  it("J001: folder name must equal the id", () => {
    const folder = { ...makeFolder(makeItem()), folderName: "other-name" };
    expect(codesFor(snapshotOf(folder))).toContain("J001");
  });

  it("J002: rejects unexpected files", () => {
    expect(codesFor(snapshotOf(makeFolder(makeItem(), undefined, ["notes.txt"])))).toContain(
      "J002",
    );
  });

  it("J010: slugs must be unique per locale", () => {
    const a = makeFolder(makeItem({ id: "a" }), [
      { locale: "pt", file: "a/pt.md", text: makeLocaleText({ slug: "same" }), body: "" },
    ]);
    const b = makeFolder(makeItem({ id: "b" }), [
      { locale: "pt", file: "b/pt.md", text: makeLocaleText({ slug: "same" }), body: "" },
    ]);
    expect(codesFor(snapshotOf(a, b))).toContain("J010");
  });

  it("J011: related items must exist", () => {
    expect(codesFor(snapshotOf(makeFolder(makeItem({ related: ["ghost"] }))))).toContain("J011");
  });

  it("J020/J021/J022: place codes must be known, not Brazil, and unique", () => {
    const item = makeItem({
      presence: [
        makePresence("XX", "widespread"),
        makePresence("BR", "widespread"),
        makePresence("PY", "widespread"),
        makePresence("PY", "regional"),
      ],
    });
    const codes = codesFor(snapshotOf(makeFolder(item)));
    expect(codes).toEqual(expect.arrayContaining(["J020", "J021", "J022"]));
  });

  it("J024: warns when a place has no map geometry", () => {
    const snapshot = { ...snapshotOf(), mapCodes: new Set(["AR"]) };
    snapshot.items = [makeFolder(makeItem())];
    const problem = runRules(snapshot, OPTIONS).find((p) => p.code === "J024");
    expect(problem?.severity).toBe("warning");
  });

  it("J023: level ranges must go from low to high", () => {
    const item = makeItem({ presence: [makePresence("PY", ["regional", "marginal"])] });
    expect(codesFor(snapshotOf(makeFolder(item)))).toContain("J023");
  });

  it("J029: an exported presence cannot be absent", () => {
    const item = makeItem({
      presence: [{ ...makePresence("PY", "absent"), exported: true }],
    });
    expect(codesFor(snapshotOf(makeFolder(item)))).toContain("J029");
    const fine = makeItem({ presence: [{ ...makePresence("PY", "marginal"), exported: true }] });
    expect(codesFor(snapshotOf(makeFolder(fine)))).not.toContain("J029");
  });

  it("J025: a subdivision's country must be present", () => {
    const subdivision = {
      subdivision: "US-LA",
      level: "widespread" as const,
      sources: ["fictional-survey"],
    };
    const without = makeItem({ subdivisions: [subdivision] });
    expect(codesFor(snapshotOf(makeFolder(without)))).toContain("J025");

    const withCountry = makeItem({
      presence: [makePresence("PY", "widespread"), makePresence("US", "regional")],
      subdivisions: [subdivision],
    });
    expect(codesFor(snapshotOf(makeFolder(withCountry)))).not.toContain("J025");
  });

  it("J030: cited sources must exist, in inputs and in the body", () => {
    const item = makeItem({ intensity: { value: 2, sources: ["ghost"] } });
    expect(codesFor(snapshotOf(makeFolder(item)))).toContain("J030");

    const bodyCitation = makeFolder(makeItem(), [
      { locale: "pt", file: "pt.md", text: makeLocaleText({ slug: "x" }), body: "Fato [@ghost]." },
    ]);
    expect(codesFor(snapshotOf(bodyCitation))).toContain("J030");
  });

  it("J031: every source must be cited, only for non-mock items", () => {
    const sources = [makeSource(), makeSource({ id: "unused", url: "https://real.test/a" })];
    const draft = makeItem({
      status: "draft",
      sources: sources.map((s) => ({ ...s, url: "https://real.test/a" })),
    });
    const problem = runRules(snapshotOf(makeFolder(draft)), OPTIONS).find((p) => p.code === "J031");
    expect(problem?.severity).toBe("warning");
    expect(codesFor(snapshotOf(makeFolder(makeItem({ sources }))))).not.toContain("J031");
  });

  it("J032: source ids must be unique", () => {
    const item = makeItem({ sources: [makeSource(), makeSource()] });
    expect(codesFor(snapshotOf(makeFolder(item)))).toContain("J032");
  });

  it("J033: mocks use only example.org; other items never do", () => {
    const mock = makeItem({ sources: [makeSource({ url: "https://www.ibge.gov.br/" })] });
    expect(codesFor(snapshotOf(makeFolder(mock)))).toContain("J033");
    const draft = makeItem({ status: "draft" });
    expect(codesFor(snapshotOf(makeFolder(draft)))).toContain("J033");
  });

  it("J034/J035: published items need archives and sourced inputs", () => {
    const item = makeItem({
      status: "published",
      sources: [makeSource({ url: "https://real.test/a" })],
      intensity: { value: 2, sources: [] },
    });
    const problems = runRules(snapshotOf(makeFolder(item)), OPTIONS);
    const j034 = problems.find((p) => p.code === "J034");
    const j035 = problems.find((p) => p.code === "J035");
    expect(j034?.severity).toBe("error");
    expect(j035?.path).toBe("intensity.sources");
  });

  it("J036: editorial inputs cannot cite sources", () => {
    const item = makeItem({
      awareness: { value: 3, sources: ["fictional-survey"], editorial: true },
    });
    expect(codesFor(snapshotOf(makeFolder(item)))).toContain("J036");
  });

  it("J040: intensity should match its ratio band", () => {
    const mismatch = makeItem({
      intensity: { value: 1, ratio: 30, sources: ["fictional-survey"] },
    });
    expect(codesFor(snapshotOf(makeFolder(mismatch)))).toContain("J040");
    const match = makeItem({ intensity: { value: 2, ratio: 3.2, sources: ["fictional-survey"] } });
    expect(codesFor(snapshotOf(makeFolder(match)))).not.toContain("J040");
  });

  it("J041: warns on intensity 4 with many places", () => {
    const presence = Array.from({ length: 25 }, (_, i) => makePresence(`P${i}`, "widespread"));
    const item = makeItem({ presence, intensity: { value: 4, sources: ["fictional-survey"] } });
    expect(codesFor(snapshotOf(makeFolder(item)))).toContain("J041");
  });

  it("J043/J044: review dates", () => {
    const future = makeItem({ lastReviewed: "2027-01-01" });
    expect(codesFor(snapshotOf(makeFolder(future)))).toContain("J044");
    const stale = makeItem({
      status: "draft",
      lastReviewed: "2024-01-01",
      sources: [makeSource({ url: "https://real.test/a" })],
    });
    expect(codesFor(snapshotOf(makeFolder(stale)))).toContain("J043");
  });

  it("J050/J051/J052: locale files", () => {
    const noPt = makeFolder(makeItem(), [
      { locale: "en", file: "en.md", text: makeLocaleText({ slug: "x" }), body: "" },
    ]);
    expect(codesFor(snapshotOf(noPt))).toContain("J050");

    const twoOriginals = makeFolder(makeItem(), [
      { locale: "pt", file: "pt.md", text: makeLocaleText({ slug: "x" }), body: "" },
      { locale: "en", file: "en.md", text: makeLocaleText({ slug: "x" }), body: "" },
    ]);
    expect(codesFor(snapshotOf(twoOriginals))).toContain("J051");

    const keyMismatch = makeFolder(makeItem(), [
      {
        locale: "pt",
        file: "pt.md",
        text: makeLocaleText({ slug: "x", presenceNotes: { PY: "Nota." } }),
        body: "",
      },
      {
        locale: "en",
        file: "en.md",
        text: makeLocaleText({ slug: "x", translationStatus: "machine" }),
        body: "",
      },
    ]);
    expect(codesFor(snapshotOf(keyMismatch))).toContain("J052");
  });

  it("J053: presence notes must refer to listed places", () => {
    const folder = makeFolder(makeItem(), [
      {
        locale: "pt",
        file: "pt.md",
        text: makeLocaleText({ slug: "x", presenceNotes: { AR: "Nota." } }),
        body: "",
      },
    ]);
    expect(codesFor(snapshotOf(folder))).toContain("J053");
  });

  it("J054/J055/J056: body links and headings", () => {
    const folder = makeFolder(makeItem(), [
      {
        locale: "pt",
        file: "pt.md",
        text: makeLocaleText({ slug: "x" }),
        body: "# Título\n\n[a](jabuticaba:ghost) e https://example.org/x",
      },
    ]);
    expect(codesFor(snapshotOf(folder))).toEqual(expect.arrayContaining(["J054", "J055", "J056"]));
  });

  it("J060: mocks fail a production build", () => {
    const snapshot = snapshotOf(makeFolder(makeItem()));
    expect(codesFor(snapshot, { ...OPTIONS, production: true })).toContain("J060");
  });
});
