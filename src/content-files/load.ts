/**
 * Reads `content/` and `data/geo/` from disk and checks every file's shape (J003, J026).
 * This is the only module in src/ that touches the filesystem.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { z } from "zod";
import type { WorldGeo } from "../geo/build-world.ts";
import { type Locale, locales } from "../i18n/ui.ts";
import { itemSchema } from "../schema/item.ts";
import { localeTextSchema } from "../schema/locale-text.ts";
import {
  type Place,
  placesSchema,
  type SubdivisionReference,
  subdivisionsFileSchema,
} from "../schema/reference.ts";
import type { ContentSnapshot, ItemFolder, LocaleTextFile, Problem } from "../validation/types.ts";
import { parseFrontmatter } from "./markdown.ts";

export const ITEMS_DIR = "content/jabuticabas";
export const PLACES_FILE = "content/reference/places.json";
export const SUBDIVISIONS_DIR = "content/reference/subdivisions";
export const WORLD_GEO_FILE = "data/geo/world.geo.json";

const SCHEMA_DOC = "docs/design/02-content-schema.md";

export interface LoadResult {
  snapshot: ContentSnapshot;
  problems: Problem[];
}

/** Zod issue path → `presence[3].place`. */
function formatIssuePath(issuePath: readonly PropertyKey[]): string {
  return issuePath
    .map((key, index) =>
      typeof key === "number" ? `[${key}]` : `${index === 0 ? "" : "."}${String(key)}`,
    )
    .join("");
}

function schemaProblems(code: string, file: string, error: z.ZodError): Problem[] {
  return error.issues.map((issue) => ({
    code,
    severity: "error",
    file,
    path: formatIssuePath(issue.path),
    message: issue.message,
    fix: `Correct the value to match the schema described in ${SCHEMA_DOC}.`,
  }));
}

function readJson(
  root: string,
  file: string,
  problems: Problem[],
): { ok: true; data: unknown } | { ok: false } {
  try {
    return { ok: true, data: JSON.parse(readFileSync(path.join(root, file), "utf8")) };
  } catch (error) {
    problems.push({
      code: "J003",
      severity: "error",
      file,
      message: `invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
      fix: "Fix the JSON syntax (look for trailing commas, missing quotes or unescaped characters).",
    });
    return { ok: false };
  }
}

function parseWith<T>(
  schema: z.ZodType<T>,
  code: string,
  root: string,
  file: string,
  problems: Problem[],
): T | undefined {
  const json = readJson(root, file, problems);
  if (!json.ok) {
    return undefined;
  }
  const result = schema.safeParse(json.data);
  if (!result.success) {
    problems.push(...schemaProblems(code, file, result.error));
    return undefined;
  }
  return result.data;
}

function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

function loadLocaleText(
  root: string,
  file: string,
  problems: Problem[],
): LocaleTextFile | undefined {
  const locale = path.posix.basename(file, ".md");
  if (!isLocale(locale)) {
    return undefined;
  }
  const parsed = parseFrontmatter(readFileSync(path.join(root, file), "utf8"));
  if (!parsed.ok) {
    problems.push({
      code: "J003",
      severity: "error",
      file,
      message: parsed.error,
      fix: 'Start the file with a --- block and double-quote every string value, e.g. title: "Capivara".',
    });
    return undefined;
  }
  const result = localeTextSchema.safeParse(parsed.data);
  if (!result.success) {
    problems.push(...schemaProblems("J003", file, result.error));
    return undefined;
  }
  return { locale, file, text: result.data, body: parsed.body };
}

function loadItemFolder(root: string, folderName: string, problems: Problem[]): ItemFolder {
  const dir = `${ITEMS_DIR}/${folderName}`;
  const fileNames = readdirSync(path.join(root, dir)).sort();
  const item = fileNames.includes("item.json")
    ? parseWith(itemSchema, "J003", root, `${dir}/item.json`, problems)
    : undefined;
  const texts: LocaleTextFile[] = [];
  for (const fileName of fileNames) {
    if (fileName.endsWith(".md")) {
      const text = loadLocaleText(root, `${dir}/${fileName}`, problems);
      if (text) {
        texts.push(text);
      }
    }
  }
  return { folderName, dir, fileNames, item, texts };
}

function listDirectories(absoluteDir: string): string[] {
  if (!existsSync(absoluteDir)) {
    return [];
  }
  return readdirSync(absoluteDir)
    .filter((name) => statSync(path.join(absoluteDir, name)).isDirectory())
    .sort();
}

export interface ReferenceData {
  places: Place[];
  /** Keyed by country code, e.g. "US". */
  subdivisions: Map<string, SubdivisionReference[]>;
  /** Undefined until `pnpm geo` has been run. */
  worldGeo: WorldGeo | undefined;
}

/** Reads places, subdivisions and the world geometry. Shape problems go to `problems`. */
export function loadReferenceData(root: string, problems: Problem[]): ReferenceData {
  const places: Place[] = parseWith(placesSchema, "J003", root, PLACES_FILE, problems) ?? [];

  const subdivisions = new Map<string, SubdivisionReference[]>();
  const subdivisionsDir = path.join(root, SUBDIVISIONS_DIR);
  if (existsSync(subdivisionsDir)) {
    for (const fileName of readdirSync(subdivisionsDir).sort()) {
      if (!fileName.endsWith(".json")) {
        continue;
      }
      const file = `${SUBDIVISIONS_DIR}/${fileName}`;
      const entries = parseWith(subdivisionsFileSchema, "J026", root, file, problems);
      if (entries) {
        subdivisions.set(path.posix.basename(fileName, ".json"), entries);
      }
    }
  }

  const worldGeoPath = path.join(root, WORLD_GEO_FILE);
  // Generated by our own script, so its shape is trusted rather than validated.
  const worldGeo = existsSync(worldGeoPath)
    ? (JSON.parse(readFileSync(worldGeoPath, "utf8")) as WorldGeo)
    : undefined;

  return { places, subdivisions, worldGeo };
}

/** Loads everything under `<root>/content`. `root` is the repository root. */
export function loadContent(root: string): LoadResult {
  const problems: Problem[] = [];
  const { places, subdivisions, worldGeo } = loadReferenceData(root, problems);
  const items = listDirectories(path.join(root, ITEMS_DIR)).map((folderName) =>
    loadItemFolder(root, folderName, problems),
  );
  const mapCodes = worldGeo && new Set(worldGeo.features.map((f) => f.properties.code));
  return { snapshot: { items, places, subdivisions, mapCodes }, problems };
}
