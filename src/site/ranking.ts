/**
 * Builds the rows of the ranking page. Pure functions: no I/O, no Astro imports.
 */
import { defaultLocale, type Locale, localizedPath } from "../i18n/ui.ts";
import type { Category, Item, ItemStatus } from "../schema/item.ts";
import type { LocaleText } from "../schema/locale-text.ts";
import type { EvidenceGrade } from "../scoring/evidence.ts";
import { isHiddenJabuticaba } from "../scoring/evidence.ts";
import type { Bounds } from "../scoring/formula.ts";
import { computeResults } from "../scoring/results-csv.ts";

export interface ItemText {
  itemId: string;
  locale: Locale;
  text: LocaleText;
  /** Raw Markdown body. */
  body: string;
}

export interface RankingRow {
  rank: number;
  id: string;
  status: ItemStatus;
  category: Category;
  title: string;
  summary: string;
  /** True when the requested locale is missing and the default locale's text is shown. */
  untranslated: boolean;
  /** Detail page, in the language of the text shown. */
  href: string;
  score: Bounds;
  evidenceGrade: EvidenceGrade;
  hiddenJabuticaba: boolean;
}

export interface RankingOptions {
  /** Show mock and draft items (dev server and preview builds). */
  includeUnpublished: boolean;
}

/**
 * Ranks the visible items and attaches their text in `locale`, falling back to
 * the default locale. Items without any text are left out.
 */
export function buildRanking(
  items: readonly Item[],
  texts: readonly ItemText[],
  locale: Locale,
  options: RankingOptions,
): RankingRow[] {
  const visible = items.filter((item) => options.includeUnpublished || item.status === "published");
  const itemsById = new Map(visible.map((item) => [item.id, item]));
  const textFor = (itemId: string, wanted: Locale) =>
    texts.find((t) => t.itemId === itemId && t.locale === wanted)?.text;

  const rows: RankingRow[] = [];
  for (const result of computeResults(visible)) {
    const item = itemsById.get(result.id);
    const localText = textFor(result.id, locale);
    const text = localText ?? textFor(result.id, defaultLocale);
    if (!item || !text) {
      continue;
    }
    const textLocale = localText ? locale : defaultLocale;
    rows.push({
      rank: result.rank,
      id: item.id,
      status: item.status,
      category: item.category,
      title: text.title,
      summary: text.summary,
      untranslated: localText === undefined,
      href: localizedPath(textLocale, `/${text.slug}/`),
      score: result.result.score,
      evidenceGrade: result.evidenceGrade,
      hiddenJabuticaba: isHiddenJabuticaba(item),
    });
  }
  return rows;
}
