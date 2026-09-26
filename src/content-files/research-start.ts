/**
 * Prepares an item for real research (`pnpm research:start <id>`). Pure functions.
 * Protocol: docs/research-protocol.md.
 *
 * - New item: a draft skeleton.
 * - Mock item: turned into a draft, with every fictional fact removed (sources,
 *   presence, ratings, article), so nothing invented can survive into real research.
 *   Title, slug, category and image are kept as placeholders to revise.
 */
import { type Category, ITEM_SCHEMA_REFERENCE, type Item } from "../schema/item.ts";
import { METHODOLOGY_VERSION } from "../scoring/constants.ts";

/** A rating nobody has researched yet: the whole 0–4 range, as editorial judgment. */
const UNKNOWN_RATING = { value: { min: 0, max: 4 }, sources: [], editorial: true as const };

export function newDraftItem(id: string, category: Category, today: string): Item {
  return {
    $schema: ITEM_SCHEMA_REFERENCE,
    id,
    status: "draft",
    methodologyVersion: METHODOLOGY_VERSION,
    lastReviewed: today,
    category,
    presence: [],
    intensity: UNKNOWN_RATING,
    awareness: UNKNOWN_RATING,
    sources: [],
  };
}

/** A mock item with all of its fictional data removed. */
export function mockToDraft(mock: Item, today: string): Item {
  const { since: _since, subdivisions: _subdivisions, related, ...kept } = mock;
  return {
    ...kept,
    status: "draft",
    methodologyVersion: METHODOLOGY_VERSION,
    lastReviewed: today,
    presence: [],
    intensity: UNKNOWN_RATING,
    awareness: UNKNOWN_RATING,
    sources: [],
    ...(related ? { related } : {}),
  };
}

/**
 * A locale file for a draft: keeps the frontmatter fields that are not facts
 * (slug, title, summary, image alt text) and replaces everything else with the
 * template's placeholders.
 */
export function draftLocaleText(
  template: string,
  previous: Record<string, unknown> | undefined,
): string {
  if (!previous) {
    return template;
  }
  let text = template;
  for (const key of ["slug", "title", "summary", "imageAlt"] as const) {
    const value = previous[key];
    if (typeof value !== "string") {
      continue;
    }
    const line = `${key}: ${JSON.stringify(value)}`;
    const pattern = new RegExp(`^${key}: .*$`, "m");
    text = pattern.test(text)
      ? text.replace(pattern, line)
      : text.replace(/\n---\n/, `\n${line}\n---\n`);
  }
  return text;
}
