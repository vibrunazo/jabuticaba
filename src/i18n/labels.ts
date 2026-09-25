/**
 * Labels for schema enums. The template-literal keys make the type checker fail
 * if a category is added to the schema without a UI label.
 */
import type { Category } from "../schema/item.ts";
import { type Locale, t } from "./ui.ts";

export function categoryLabel(locale: Locale, category: Category): string {
  return t(locale, `category.${category}`);
}
