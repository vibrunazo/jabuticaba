/**
 * Fixed site pages and their localized slugs. Item slugs may not reuse these
 * (validation rule J012), or the item page would clash with the fixed page.
 */
import { type Locale, localizedPath } from "./ui.ts";

export const PAGE_SLUGS = {
  methodology: { pt: "metodologia", en: "methodology" },
} as const satisfies Record<string, Record<Locale, string>>;

export type PageId = keyof typeof PAGE_SLUGS;

export function pagePath(locale: Locale, page: PageId): string {
  return localizedPath(locale, `/${PAGE_SLUGS[page][locale]}/`);
}

export const RESERVED_SLUGS: ReadonlySet<string> = new Set(
  Object.values(PAGE_SLUGS).flatMap((slugs) => Object.values(slugs)),
);
