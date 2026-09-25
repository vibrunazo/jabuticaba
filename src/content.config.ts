/**
 * Astro content collections. The schemas are shared with `pnpm validate`, so the
 * dev server and the validator report the same shape errors.
 * Cross-file rules (J0xx) only run in `pnpm validate`.
 */

import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { itemSchema } from "./schema/item.ts";
import { localeTextSchema } from "./schema/locale-text.ts";

const ITEMS_BASE = "./content/jabuticabas";

/** One entry per item; entry id = item folder name. */
const items = defineCollection({
  loader: glob({
    pattern: "*/item.json",
    base: ITEMS_BASE,
    generateId: ({ entry }) => entry.split("/")[0] ?? entry,
  }),
  schema: itemSchema,
});

/** One entry per locale file; entry id = "<item-id>/<locale>", e.g. "capybara/pt". */
const itemTexts = defineCollection({
  loader: glob({
    pattern: "*/*.md",
    base: ITEMS_BASE,
    generateId: ({ entry }) => entry.replace(/\.md$/, ""),
  }),
  schema: localeTextSchema,
});

export const collections = { items, itemTexts };
