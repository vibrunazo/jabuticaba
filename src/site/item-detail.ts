/**
 * Builds everything the item detail page shows. Pure functions: no I/O, no Astro.
 */
import { extractCitations } from "../content-files/markdown.ts";
import { placeName } from "../i18n/format.ts";
import { defaultLocale, type Locale, localizedPath } from "../i18n/ui.ts";
import type { Item, Source } from "../schema/item.ts";
import type { LocaleText } from "../schema/locale-text.ts";
import type { Place, SubdivisionReference } from "../schema/reference.ts";
import type { PresenceLevel } from "../schema/shared.ts";
import {
  computeEvidenceGrade,
  type EvidenceGrade,
  isHiddenJabuticaba,
} from "../scoring/evidence.ts";
import { computeItemScore, type ItemScore, presenceWeight } from "../scoring/formula.ts";
import { computeResults } from "../scoring/results-csv.ts";
import { sourceAnchor } from "./citations.ts";
import type { ItemText } from "./ranking.ts";

export interface NumberedSource {
  number: number;
  anchor: string;
  source: Source;
}

export interface EvidenceRefs {
  sourceNumbers: number[];
  editorial: boolean;
}

export interface PresenceRow extends EvidenceRefs {
  place: string;
  name: string;
  /** Sovereign state's name, for territories: "França" for GF. */
  sovereignName: string | undefined;
  low: PresenceLevel;
  high: PresenceLevel;
  /** Present there only as a Brazilian export. */
  exported: boolean;
  note: string | undefined;
}

export interface SubdivisionRow extends EvidenceRefs {
  subdivision: string;
  name: string;
  low: PresenceLevel;
  high: PresenceLevel;
  note: string | undefined;
}

export interface ItemLink {
  id: string;
  title: string;
  href: string;
  /** The linked page's language, when it differs from the current page. */
  lang: Locale | undefined;
}

export interface ItemDetail {
  item: Item;
  text: LocaleText;
  locale: Locale;
  rank: number;
  total: number;
  score: ItemScore;
  evidenceGrade: EvidenceGrade;
  hiddenJabuticaba: boolean;
  sources: NumberedSource[];
  presence: PresenceRow[];
  subdivisions: SubdivisionRow[];
  intensity: EvidenceRefs;
  awareness: EvidenceRefs;
  related: ItemLink[];
  /** This page in every locale that has it. */
  alternates: Partial<Record<Locale, string>>;
}

export interface ItemDetailInput {
  item: Item;
  locale: Locale;
  /** Items shown on the site (already filtered by status), including this one. */
  visibleItems: readonly Item[];
  texts: readonly ItemText[];
  places: readonly Place[];
  subdivisions: ReadonlyMap<string, readonly SubdivisionReference[]>;
}

export function itemHref(locale: Locale, slug: string): string {
  return localizedPath(locale, `/${slug}/`);
}

function textFor(texts: readonly ItemText[], itemId: string, locale: Locale) {
  return texts.find((t) => t.itemId === itemId && t.locale === locale);
}

function levelEnds(level: PresenceLevel | readonly [PresenceLevel, PresenceLevel]) {
  return typeof level === "string"
    ? { low: level, high: level }
    : { low: level[0], high: level[1] };
}

/**
 * Numbers sources in reading order: first as cited in this locale's article,
 * then as used by the inputs (presence, subdivisions, intensity, awareness),
 * then any others in list order.
 */
export function numberSources(item: Item, body: string): NumberedSource[] {
  const order: string[] = [];
  const add = (id: string) => {
    if (!order.includes(id)) {
      order.push(id);
    }
  };
  extractCitations(body).forEach(add);
  for (const input of [
    ...item.presence,
    ...(item.subdivisions ?? []),
    item.intensity,
    item.awareness,
  ]) {
    input.sources.forEach(add);
  }
  for (const source of item.sources) {
    add(source.id);
  }
  return order.flatMap((id, index) => {
    const source = item.sources.find((s) => s.id === id);
    return source ? [{ number: index + 1, anchor: sourceAnchor(id), source }] : [];
  });
}

export function buildItemDetail(input: ItemDetailInput): ItemDetail | undefined {
  const { item, locale, visibleItems, texts, places, subdivisions } = input;
  const localText = textFor(texts, item.id, locale);
  if (!localText) {
    return undefined;
  }
  const text = localText.text;
  const sources = numberSources(item, localText.body);
  const numberOf = new Map(sources.map((s) => [s.source.id, s.number]));
  const refs = (evidence: { sources: readonly string[]; editorial?: true | undefined }) => ({
    sourceNumbers: evidence.sources.flatMap((id) => numberOf.get(id) ?? []).sort((a, b) => a - b),
    editorial: evidence.editorial === true,
  });

  const sovereignOf = new Map(places.map((p) => [p.code, p.sovereign]));
  const presence: PresenceRow[] = item.presence
    .map((entry) => {
      const sovereign = sovereignOf.get(entry.place);
      return {
        place: entry.place,
        name: placeName(locale, entry.place),
        sovereignName: sovereign ? placeName(locale, sovereign) : undefined,
        ...levelEnds(entry.level),
        exported: entry.exported === true,
        note: text.presenceNotes?.[entry.place],
        ...refs(entry),
      };
    })
    .sort(
      (a, b) =>
        presenceWeight(b.high, b.exported) - presenceWeight(a.high, a.exported) ||
        presenceWeight(b.low, b.exported) - presenceWeight(a.low, a.exported) ||
        a.name.localeCompare(b.name, locale),
    );

  const subdivisionRows: SubdivisionRow[] = (item.subdivisions ?? []).map((entry) => {
    const country = entry.subdivision.slice(0, 2);
    const reference = subdivisions.get(country)?.find((s) => s.code === entry.subdivision);
    return {
      subdivision: entry.subdivision,
      name: reference?.names[locale] ?? entry.subdivision,
      ...levelEnds(entry.level),
      note: text.subdivisionNotes?.[entry.subdivision],
      ...refs(entry),
    };
  });

  const ranked = computeResults(visibleItems);
  const rank = ranked.find((r) => r.id === item.id)?.rank ?? ranked.length;

  const visibleIds = new Set(visibleItems.map((i) => i.id));
  const relatedIds = [
    ...(item.related ?? []),
    ...visibleItems.filter((other) => other.related?.includes(item.id)).map((other) => other.id),
  ].filter((id, index, all) => id !== item.id && visibleIds.has(id) && all.indexOf(id) === index);
  const related: ItemLink[] = relatedIds.flatMap((id) => {
    const linked = textFor(texts, id, locale) ?? textFor(texts, id, defaultLocale);
    if (!linked) {
      return [];
    }
    return [
      {
        id,
        title: linked.text.title,
        href: itemHref(linked.locale, linked.text.slug),
        lang: linked.locale === locale ? undefined : linked.locale,
      },
    ];
  });

  const alternates: Partial<Record<Locale, string>> = {};
  for (const t of texts.filter((t) => t.itemId === item.id)) {
    alternates[t.locale] = itemHref(t.locale, t.text.slug);
  }

  return {
    item,
    text,
    locale,
    rank,
    total: ranked.length,
    score: computeItemScore(item),
    evidenceGrade: computeEvidenceGrade(item),
    hiddenJabuticaba: isHiddenJabuticaba(item),
    sources,
    presence,
    subdivisions: subdivisionRows,
    intensity: refs(item.intensity),
    awareness: refs(item.awareness),
    related,
    alternates,
  };
}
