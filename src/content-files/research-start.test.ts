import { describe, expect, it } from "vitest";
import { makeItem, makePresence, makeSource } from "../testing/make-item.ts";
import { draftLocaleText, mockToDraft, newDraftItem } from "./research-start.ts";

describe("newDraftItem", () => {
  it("creates an empty draft", () => {
    const item = newDraftItem("new-thing", "food", "2026-09-26");
    expect(item).toMatchObject({
      id: "new-thing",
      status: "draft",
      category: "food",
      presence: [],
    });
    expect(item.sources).toEqual([]);
  });
});

describe("mockToDraft", () => {
  it("removes every fictional fact and keeps identity fields", () => {
    const mock = makeItem({
      id: "nets",
      category: "urban",
      since: 1990,
      presence: [makePresence("CN", "regional")],
      subdivisions: [{ subdivision: "BR-SP", level: "widespread", sources: ["fictional-survey"] }],
      intensity: { value: 3, ratio: 8, sources: ["fictional-survey"] },
      sources: [makeSource()],
      related: ["other"],
      image: { file: "cover.webp", credit: { author: "A", license: "CC0-1.0" } },
    });
    const draft = mockToDraft(mock, "2026-09-26");
    expect(draft.status).toBe("draft");
    expect(draft.presence).toEqual([]);
    expect(draft.sources).toEqual([]);
    expect(draft.subdivisions).toBeUndefined();
    expect(draft.since).toBeUndefined();
    expect(draft.intensity).toEqual({ value: { min: 0, max: 4 }, sources: [], editorial: true });
    expect(draft).toMatchObject({ id: "nets", category: "urban", related: ["other"] });
    expect(draft.image?.file).toBe("cover.webp");
    expect(draft.lastReviewed).toBe("2026-09-26");
  });
});

describe("draftLocaleText", () => {
  const template = [
    "---",
    'slug: "<slug>"',
    'title: "<title>"',
    'summary: "<summary>"',
    "---",
    "",
    "Body",
  ].join("\n");

  it("keeps the non-factual fields of the previous text", () => {
    const text = draftLocaleText(template, {
      slug: "redes",
      title: "Redes",
      summary: "S.",
      imageAlt: "Alt.",
      definition: "Old",
    });
    expect(text).toContain('slug: "redes"');
    expect(text).toContain('title: "Redes"');
    expect(text).toContain('imageAlt: "Alt."');
    expect(text).not.toContain("Old");
    expect(text).toContain("Body");
  });

  it("returns the template unchanged for a new item", () => {
    expect(draftLocaleText(template, undefined)).toBe(template);
  });
});
