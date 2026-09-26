/**
 * Sections of an item's published text, in order. Spec: docs/editorial-guide.md,
 * section 3. Checked by validation rule J057 (headings) and J058 (length).
 */
import type { Locale } from "../i18n/ui.ts";

export interface ProseSection {
  id: string;
  required: boolean;
  heading: Record<Locale, string>;
}

export const PROSE_SECTIONS: readonly ProseSection[] = [
  { id: "in-brazil", required: true, heading: { pt: "No Brasil", en: "In Brazil" } },
  { id: "abroad", required: true, heading: { pt: "Lá fora", en: "Abroad" } },
  { id: "why", required: true, heading: { pt: "Por quê?", en: "Why?" } },
  { id: "culture-shock", required: false, heading: { pt: "Choque cultural", en: "Culture shock" } },
  { id: "verdict", required: true, heading: { pt: "Veredito", en: "Verdict" } },
];

/** Expected length of the whole text, in words (warning J058 outside it). */
export const PROSE_WORD_RANGE = { min: 300, max: 700 } as const;

/**
 * Checks the `##` headings of a text against PROSE_SECTIONS. Returns a
 * description of the first problem, or undefined when the structure is right.
 */
export function proseStructureProblem(
  headings: readonly string[],
  locale: Locale,
): string | undefined {
  let next = 0;
  for (const heading of headings) {
    const index = PROSE_SECTIONS.findIndex((s, i) => i >= next && s.heading[locale] === heading);
    if (index === -1) {
      return `unexpected or out-of-order section "## ${heading}"`;
    }
    const skipped = PROSE_SECTIONS.slice(next, index).find((s) => s.required);
    if (skipped) {
      return `missing section "## ${skipped.heading[locale]}" before "## ${heading}"`;
    }
    next = index + 1;
  }
  const missing = PROSE_SECTIONS.slice(next).find((s) => s.required);
  return missing ? `missing section "## ${missing.heading[locale]}"` : undefined;
}
