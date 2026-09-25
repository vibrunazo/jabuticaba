/**
 * Reads the Astro content collections and reference data. Only for use in .astro
 * files: this module depends on Astro, unlike the rest of the logic.
 */
import { getCollection } from "astro:content";
import { loadReferenceData, type ReferenceData } from "../content-files/load.ts";
import { type ProjectedWorld, type ProjectionName, projectWorld } from "../geo/world-map.ts";
import { type Locale, locales } from "../i18n/ui.ts";
import type { Item } from "../schema/item.ts";
import type { Problem } from "../validation/types.ts";
import type { ItemText } from "./ranking.ts";

/**
 * Mock and draft items are shown everywhere except the production build
 * (`astro build`); `pnpm build:preview` builds with `--mode preview`.
 */
export const includeUnpublished = import.meta.env.MODE !== "production";

export async function loadItems(): Promise<Item[]> {
  return (await getCollection("items")).map((entry) => entry.data);
}

/** Items shown on the site, given the build mode. */
export async function loadVisibleItems(): Promise<Item[]> {
  return (await loadItems()).filter((item) => includeUnpublished || item.status === "published");
}

function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Entry ids look like "capybara/pt". */
export async function loadItemTexts(): Promise<ItemText[]> {
  return (await getCollection("itemTexts")).flatMap((entry) => {
    const [itemId, locale] = entry.id.split("/");
    return itemId && locale && isLocale(locale)
      ? [{ itemId, locale, text: entry.data, body: entry.body ?? "" }]
      : [];
  });
}

/** The article HTML as rendered by Astro, before citations are processed. */
export async function loadRenderedBody(itemId: string, locale: Locale): Promise<string> {
  const entries = await getCollection("itemTexts");
  return entries.find((entry) => entry.id === `${itemId}/${locale}`)?.rendered?.html ?? "";
}

let referenceData: ReferenceData | undefined;

/** Places, subdivisions and world geometry. Read once per build; fails on invalid files. */
export function loadReference(): ReferenceData {
  if (!referenceData) {
    const problems: Problem[] = [];
    referenceData = loadReferenceData(process.cwd(), problems);
    if (problems.length > 0) {
      throw new Error(
        `Invalid reference data; run \`pnpm validate\`. First problem: ${problems[0]?.file}`,
      );
    }
  }
  return referenceData;
}

const projectedWorlds = new Map<ProjectionName, ProjectedWorld>();

/** World map paths for one projection; identical for every page, so computed once. */
export function loadProjectedWorld(name: ProjectionName): ProjectedWorld {
  let world = projectedWorlds.get(name);
  if (!world) {
    const { worldGeo } = loadReference();
    if (!worldGeo) {
      throw new Error("Missing data/geo/world.geo.json; run `pnpm geo`.");
    }
    world = projectWorld(worldGeo, name);
    projectedWorlds.set(name, world);
  }
  return world;
}

/** Static paths for the item pages of one locale: one per visible item with a text in it. */
export async function itemPaths(locale: Locale) {
  const visibleIds = new Set((await loadVisibleItems()).map((item) => item.id));
  return (await loadItemTexts())
    .filter((text) => text.locale === locale && visibleIds.has(text.itemId))
    .map((text) => ({ params: { slug: text.text.slug }, props: { itemId: text.itemId } }));
}
