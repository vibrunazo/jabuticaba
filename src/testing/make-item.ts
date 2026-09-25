/**
 * Builders for valid test data. Tests override only the fields they care about.
 * Used by tests only.
 */
import type { Item, PresenceEntry, Source } from "../schema/item.ts";
import { ITEM_SCHEMA_REFERENCE } from "../schema/item.ts";
import type { LocaleText } from "../schema/locale-text.ts";

export function makeSource(overrides: Partial<Source> = {}): Source {
  return {
    id: "fictional-survey",
    type: "academic",
    title: "Fictional Survey",
    publisher: "Institute of Imaginary Research",
    url: "https://example.org/survey",
    accessed: "2026-09-25",
    language: "en",
    ...overrides,
  };
}

export function makePresence(
  place: string,
  level: PresenceEntry["level"],
  sources: string[] = ["fictional-survey"],
): PresenceEntry {
  return { place, level, sources };
}

export function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    $schema: ITEM_SCHEMA_REFERENCE,
    id: "test-item",
    status: "mock",
    methodologyVersion: "0.1",
    lastReviewed: "2026-09-25",
    category: "nature",
    presence: [makePresence("PY", "widespread")],
    intensity: { value: 2, sources: ["fictional-survey"] },
    awareness: { value: 3, sources: [], editorial: true },
    sources: [makeSource()],
    ...overrides,
  };
}

export function makeLocaleText(overrides: Partial<LocaleText> = {}): LocaleText {
  return {
    translationStatus: "original",
    slug: "item-de-teste",
    title: "Item de teste",
    summary: "Um item de teste.",
    definition: "Definição de teste.",
    justifications: { intensity: "Justificativa.", awareness: "Justificativa." },
    ...overrides,
  };
}
