/**
 * Labels for schema enums. The template-literal keys make the type checker fail
 * if a value is added to the schema without a UI label.
 */
import type { ProjectionName } from "../geo/world-map.ts";
import type { Category, SourceType } from "../schema/item.ts";
import type { PresenceLevel } from "../schema/shared.ts";
import { type Locale, t } from "./ui.ts";

export function categoryLabel(locale: Locale, category: Category): string {
  return t(locale, `category.${category}`);
}

export function levelLabel(locale: Locale, level: PresenceLevel): string {
  return t(locale, `level.${level}`);
}

/** "Marginal", or "Ausente (verificado)–Marginal" for a range. */
export function levelRangeLabel(locale: Locale, low: PresenceLevel, high: PresenceLevel): string {
  return low === high
    ? levelLabel(locale, low)
    : `${levelLabel(locale, low)} – ${levelLabel(locale, high)}`;
}

export function sourceTypeLabel(locale: Locale, type: SourceType): string {
  return t(locale, `sourceType.${type}`);
}

export function projectionLabel(locale: Locale, projection: ProjectionName): string {
  return t(locale, `projection.${projection}`);
}
