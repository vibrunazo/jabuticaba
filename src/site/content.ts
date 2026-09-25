/**
 * Reads the Astro content collections. Only for use in .astro files: this module
 * depends on Astro, unlike the rest of the logic.
 */
import { getCollection } from "astro:content";
import { type Locale, locales } from "../i18n/ui.ts";
import type { Item } from "../schema/item.ts";
import type { ItemText } from "./ranking.ts";

/**
 * Mock and draft items are shown everywhere except the production build
 * (`astro build`); `pnpm build:preview` builds with `--mode preview`.
 */
export const includeUnpublished = import.meta.env.MODE !== "production";

export async function loadItems(): Promise<Item[]> {
  return (await getCollection("items")).map((entry) => entry.data);
}

function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Entry ids look like "capybara/pt". */
export async function loadItemTexts(): Promise<ItemText[]> {
  return (await getCollection("itemTexts")).flatMap((entry) => {
    const [itemId, locale] = entry.id.split("/");
    return itemId && locale && isLocale(locale) ? [{ itemId, locale, text: entry.data }] : [];
  });
}
