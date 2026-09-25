/**
 * Cross-file validation rules. Pure functions: no I/O.
 * Spec: docs/design/02-content-schema.md, section 10. Each rule's code matches the table there.
 *
 * Not implemented yet (needs subdivision geometry): J027.
 * J003 and J026 (shape) are checked by the loader; J070, J071 and J072 by their scripts.
 */

import {
  extractCitations,
  extractExternalLinks,
  extractItemLinks,
  hasH1Heading,
} from "../content-files/markdown.ts";
import { RESERVED_SLUGS } from "../i18n/routes.ts";
import { defaultLocale, locales } from "../i18n/ui.ts";
import {
  IMAGE_FILE_PATTERN,
  type Item,
  type ItemStatus,
  type PresenceEntry,
  type SubdivisionEntry,
} from "../schema/item.ts";
import { PRESENCE_LEVELS, type Rating } from "../schema/shared.ts";
import {
  INTENSITY_4_MAX_PLACE_COUNT,
  INTENSITY_RATIO_BAND_LIMITS,
  METHODOLOGY_VERSION,
} from "../scoring/constants.ts";
import { placeCountBounds, ratingBounds } from "../scoring/formula.ts";
import type { ContentSnapshot, ItemFolder, Problem, Severity, ValidationOptions } from "./types.ts";

const MOCK_HOST = "example.org";
const REVIEW_MAX_AGE_YEARS = 2;
const BRAZIL = "BR";

type ItemRule = (folder: ItemFolder, item: Item, context: RuleContext) => Problem[];
type SnapshotRule = (snapshot: ContentSnapshot, options: ValidationOptions) => Problem[];

interface RuleContext {
  snapshot: ContentSnapshot;
  options: ValidationOptions;
  itemIds: Set<string>;
  placeCodes: Set<string>;
}

function itemFile(folder: ItemFolder): string {
  return `${folder.dir}/item.json`;
}

/**
 * Severity for rules scoped to published items: an error when published, a warning
 * for drafts, skipped for mocks.
 */
function publishedScope(status: ItemStatus): Severity | undefined {
  if (status === "published") {
    return "error";
  }
  return status === "draft" ? "warning" : undefined;
}

/** Every input that carries evidence, with its path in item.json. */
function evidenceInputs(item: Item) {
  return [
    ...item.presence.map((entry, i) => ({ path: `presence[${i}]`, input: entry })),
    ...(item.subdivisions ?? []).map((entry, i) => ({ path: `subdivisions[${i}]`, input: entry })),
    { path: "intensity", input: item.intensity },
    { path: "awareness", input: item.awareness },
  ];
}

function levelIndex(level: string): number {
  return (PRESENCE_LEVELS as readonly string[]).indexOf(level);
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

// --- Structure and identity -------------------------------------------------

const folderMatchesId: ItemRule = (folder, item) =>
  folder.folderName === item.id
    ? []
    : [
        {
          code: "J001",
          severity: "error",
          file: itemFile(folder),
          path: "id",
          message: `id "${item.id}" does not match the folder name "${folder.folderName}"`,
          fix: "Rename the folder or change the id so they are identical. Ids never change once published.",
        },
      ];

const onlyAllowedFiles = (folder: ItemFolder): Problem[] => {
  const allowed = new Set(["item.json", ...locales.map((locale) => `${locale}.md`)]);
  return folder.fileNames
    .filter((fileName) => !allowed.has(fileName) && !IMAGE_FILE_PATTERN.test(fileName))
    .map((fileName) => ({
      code: "J002",
      severity: "error" as const,
      file: `${folder.dir}/${fileName}`,
      message: `unexpected file in an item folder`,
      fix: `An item folder may only contain item.json, ${locales.map((l) => `${l}.md`).join(", ")} and one cover image (cover.webp, .jpg, .png or .avif). Move or delete this file.`,
    }));
};

const uniqueSlugs: SnapshotRule = (snapshot) => {
  const problems: Problem[] = [];
  for (const locale of locales) {
    const seen = new Map<string, string>();
    for (const folder of snapshot.items) {
      for (const text of folder.texts.filter((t) => t.locale === locale)) {
        const other = seen.get(text.text.slug);
        if (other) {
          problems.push({
            code: "J010",
            severity: "error",
            file: text.file,
            path: "slug",
            message: `slug "${text.text.slug}" is already used by ${other}`,
            fix: "Choose a different slug; slugs must be unique within each locale.",
          });
        } else {
          seen.set(text.text.slug, text.file);
        }
      }
    }
  }
  return problems;
};

const slugsAreNotReserved: ItemRule = (folder) =>
  folder.texts
    .filter((text) => RESERVED_SLUGS.has(text.text.slug))
    .map((text) => ({
      code: "J012",
      severity: "error" as const,
      file: text.file,
      path: "slug",
      message: `slug "${text.text.slug}" is reserved for a fixed page of the site`,
      fix: "Choose another slug; reserved ones are listed in src/i18n/routes.ts.",
    }));

const relatedItemsExist: ItemRule = (folder, item, { itemIds }) => {
  const problems: Problem[] = [];
  const seen = new Set<string>();
  (item.related ?? []).forEach((relatedId, i) => {
    const base = {
      code: "J011",
      severity: "error" as const,
      file: itemFile(folder),
      path: `related[${i}]`,
    };
    if (relatedId === item.id) {
      problems.push({
        ...base,
        message: "an item cannot be related to itself",
        fix: "Remove this entry.",
      });
    } else if (seen.has(relatedId)) {
      problems.push({
        ...base,
        message: `"${relatedId}" is listed twice`,
        fix: "Remove the duplicate.",
      });
    } else if (!itemIds.has(relatedId)) {
      problems.push({
        ...base,
        message: `no item with id "${relatedId}"`,
        fix: "Use the id of an existing item (its folder name in content/jabuticabas/).",
      });
    }
    seen.add(relatedId);
  });
  return problems;
};

// --- Places ------------------------------------------------------------------

const placesAreValid: ItemRule = (folder, item, { placeCodes, snapshot }) => {
  const problems: Problem[] = [];
  const file = itemFile(folder);
  const seenPlaces = new Set<string>();
  item.presence.forEach((entry, i) => {
    const path = `presence[${i}].place`;
    if (entry.place === BRAZIL) {
      problems.push({
        code: "J021",
        severity: "error",
        file,
        path,
        message: "Brazil cannot be listed in presence",
        fix: "Remove this entry. Presence lists the places outside Brazil; use subdivisions for Brazilian states.",
      });
    } else if (!placeCodes.has(entry.place)) {
      problems.push({
        code: "J020",
        severity: "error",
        file,
        path,
        message: `"${entry.place}" is not a known place code`,
        fix: "Use an ISO 3166-1 alpha-2 code listed in content/reference/places.json.",
      });
    }
    if (seenPlaces.has(entry.place)) {
      problems.push({
        code: "J022",
        severity: "error",
        file,
        path,
        message: `"${entry.place}" is listed more than once`,
        fix: 'Merge the entries into one; use a level range such as ["marginal", "regional"] if unsure.',
      });
    }
    seenPlaces.add(entry.place);
  });

  const seenSubdivisions = new Set<string>();
  (item.subdivisions ?? []).forEach((entry, i) => {
    const path = `subdivisions[${i}].subdivision`;
    const country = entry.subdivision.slice(0, 2);
    const known = snapshot.subdivisions.get(country)?.some((s) => s.code === entry.subdivision);
    if (!known) {
      problems.push({
        code: "J020",
        severity: "error",
        file,
        path,
        message: `"${entry.subdivision}" is not a known subdivision code`,
        fix: `Use an ISO 3166-2 code listed in content/reference/subdivisions/${country}.json (create or extend that file if needed).`,
      });
    }
    if (seenSubdivisions.has(entry.subdivision)) {
      problems.push({
        code: "J022",
        severity: "error",
        file,
        path,
        message: `"${entry.subdivision}" is listed more than once`,
        fix: "Merge the entries into one.",
      });
    }
    seenSubdivisions.add(entry.subdivision);
  });
  return problems;
};

const placesAreMappable: ItemRule = (folder, item, { snapshot }) => {
  const { mapCodes } = snapshot;
  if (!mapCodes) {
    return [];
  }
  return item.presence.flatMap((entry, i) =>
    mapCodes.has(entry.place) || entry.place === BRAZIL
      ? []
      : [
          {
            code: "J024",
            severity: "warning" as const,
            file: itemFile(folder),
            path: `presence[${i}].place`,
            message: `"${entry.place}" has no geometry on the world map; it counts, but is not drawn`,
            fix: "Nothing to fix if the place is tiny. It still appears in the presence table.",
          },
        ],
  );
};

const levelRangesAreOrdered: ItemRule = (folder, item) => {
  const entries: { path: string; entry: PresenceEntry | SubdivisionEntry }[] = [
    ...item.presence.map((entry, i) => ({ path: `presence[${i}].level`, entry })),
    ...(item.subdivisions ?? []).map((entry, i) => ({ path: `subdivisions[${i}].level`, entry })),
  ];
  return entries.flatMap(({ path, entry }) => {
    if (typeof entry.level === "string") {
      return [];
    }
    const [low, high] = entry.level;
    return levelIndex(low) < levelIndex(high)
      ? []
      : [
          {
            code: "J023",
            severity: "error" as const,
            file: itemFile(folder),
            path,
            message: `range [${low}, ${high}] is not ordered from low to high`,
            fix: `Write the lower level first. Order: ${PRESENCE_LEVELS.join(" < ")}. Use a single level if both ends are equal.`,
          },
        ];
  });
};

const exportsArePresent: ItemRule = (folder, item) =>
  item.presence.flatMap((entry, i) => {
    const high = typeof entry.level === "string" ? entry.level : entry.level[1];
    return entry.exported && high === "absent"
      ? [
          {
            code: "J029",
            severity: "error" as const,
            file: itemFile(folder),
            path: `presence[${i}].exported`,
            message: "an exported presence cannot be absent",
            fix: 'Give the level at which the export is found (e.g. "marginal"), or remove `exported`.',
          },
        ]
      : [];
  });

const subdivisionCountriesArePresent: ItemRule = (folder, item) =>
  (item.subdivisions ?? []).flatMap((entry, i) => {
    const country = entry.subdivision.slice(0, 2);
    if (country === BRAZIL) {
      return [];
    }
    const presence = item.presence.find((p) => p.place === country);
    const highLevel =
      presence && (typeof presence.level === "string" ? presence.level : presence.level[1]);
    if (highLevel && highLevel !== "absent") {
      return [];
    }
    return [
      {
        code: "J025",
        severity: "error" as const,
        file: itemFile(folder),
        path: `subdivisions[${i}].subdivision`,
        message: `${entry.subdivision} is listed, but ${country} is not in presence with a level above "absent"`,
        fix: `Add ${country} to presence (e.g. as "regional") or remove this subdivision.`,
      },
    ];
  });

const noteKeysExist: ItemRule = (folder, item) => {
  const places = new Set(item.presence.map((p) => p.place));
  const subdivisions = new Set((item.subdivisions ?? []).map((s) => s.subdivision));
  return folder.texts.flatMap((text) => [
    ...Object.keys(text.text.presenceNotes ?? {})
      .filter((key) => !places.has(key))
      .map((key) => ({
        code: "J053",
        severity: "error" as const,
        file: text.file,
        path: `presenceNotes.${key}`,
        message: `note for "${key}", which is not in item.json presence`,
        fix: "Remove the note, or add the place to presence in item.json.",
      })),
    ...Object.keys(text.text.subdivisionNotes ?? {})
      .filter((key) => !subdivisions.has(key))
      .map((key) => ({
        code: "J028",
        severity: "error" as const,
        file: text.file,
        path: `subdivisionNotes.${key}`,
        message: `note for "${key}", which is not in item.json subdivisions`,
        fix: "Remove the note, or add the subdivision to item.json.",
      })),
  ]);
};

// --- Sources -----------------------------------------------------------------

const citedSourcesExist: ItemRule = (folder, item) => {
  const sourceIds = new Set(item.sources.map((s) => s.id));
  const fix = "Add a source with this id to the sources list in item.json, or fix the id.";
  const fromInputs = evidenceInputs(item).flatMap(({ path, input }) =>
    input.sources
      .filter((id) => !sourceIds.has(id))
      .map((id) => ({
        code: "J030",
        severity: "error" as const,
        file: itemFile(folder),
        path: `${path}.sources`,
        message: `cites unknown source "${id}"`,
        fix,
      })),
  );
  const fromBodies = folder.texts.flatMap((text) =>
    extractCitations(text.body)
      .filter((id) => !sourceIds.has(id))
      .map((id) => ({
        code: "J030",
        severity: "error" as const,
        file: text.file,
        message: `citation [@${id}] points to an unknown source`,
        fix,
      })),
  );
  return [...fromInputs, ...fromBodies];
};

const everySourceIsCited: ItemRule = (folder, item) => {
  const severity = publishedScope(item.status);
  if (!severity) {
    return [];
  }
  const cited = new Set([
    ...evidenceInputs(item).flatMap(({ input }) => input.sources),
    ...folder.texts.flatMap((text) => extractCitations(text.body)),
  ]);
  return item.sources.flatMap((source, i) =>
    cited.has(source.id)
      ? []
      : [
          {
            code: "J031",
            severity,
            file: itemFile(folder),
            path: `sources[${i}]`,
            message: `source "${source.id}" is never cited`,
            fix: "Cite it from an input's sources or with [@id] in the text, or remove it.",
          },
        ],
  );
};

const sourceIdsAreUnique: ItemRule = (folder, item) => {
  const seen = new Set<string>();
  return item.sources.flatMap((source, i) => {
    const duplicate = seen.has(source.id);
    seen.add(source.id);
    return duplicate
      ? [
          {
            code: "J032",
            severity: "error" as const,
            file: itemFile(folder),
            path: `sources[${i}].id`,
            message: `source id "${source.id}" is used more than once`,
            fix: "Give each source a unique, descriptive id.",
          },
        ]
      : [];
  });
};

const mockUrlsMatchStatus: ItemRule = (folder, item) =>
  [
    ...item.sources.flatMap((source, i) =>
      (["url", "archiveUrl"] as const).map((field) => ({
        url: source[field],
        path: `sources[${i}].${field}`,
      })),
    ),
    { url: item.image?.credit.url, path: "image.credit.url" },
  ].flatMap(({ url, path }) => {
    if (!url) {
      return [];
    }
    const isMockUrl = hostOf(url) === MOCK_HOST;
    if (item.status === "mock" && !isMockUrl) {
      return [
        {
          code: "J033",
          severity: "error" as const,
          file: itemFile(folder),
          path,
          message: "mock items may only link to https://example.org/",
          fix: "Replace the URL with a fake one on https://example.org/. Mock data must never point to real documents.",
        },
      ];
    }
    if (item.status !== "mock" && isMockUrl) {
      return [
        {
          code: "J033",
          severity: "error" as const,
          file: itemFile(folder),
          path,
          message: `${item.status} items must not use placeholder example.org URLs`,
          fix: "Replace it with the real source URL.",
        },
      ];
    }
    return [];
  });

// --- Images ------------------------------------------------------------------

const imageIsConsistent: ItemRule = (folder, item) => {
  const problems: Problem[] = [];
  const covers = folder.fileNames.filter((name) => IMAGE_FILE_PATTERN.test(name));
  if (item.image && !folder.fileNames.includes(item.image.file)) {
    problems.push({
      code: "J080",
      severity: "error",
      file: itemFile(folder),
      path: "image.file",
      message: `"${item.image.file}" does not exist in the item folder`,
      fix: "Add the image file to the item folder, or fix the file name.",
    });
  }
  for (const cover of covers.filter((name) => name !== item.image?.file)) {
    problems.push({
      code: "J082",
      severity: "warning",
      file: `${folder.dir}/${cover}`,
      message: "image file is not used by item.json",
      fix: 'Reference it in item.json ("image": { "file": … , "credit": … }) or delete it.',
    });
  }
  for (const text of folder.texts) {
    const hasAlt = text.text.imageAlt !== undefined;
    if (item.image && !hasAlt) {
      problems.push({
        code: "J081",
        severity: "error",
        file: text.file,
        path: "imageAlt",
        message: "the item has an image but this locale has no imageAlt",
        fix: "Add imageAlt: a short description of what the image shows, for screen readers.",
      });
    } else if (!item.image && hasAlt) {
      problems.push({
        code: "J081",
        severity: "error",
        file: text.file,
        path: "imageAlt",
        message: "imageAlt is set, but item.json has no image",
        fix: "Remove imageAlt, or add the image to item.json.",
      });
    }
  }
  return problems;
};

const sourcesAreArchived: ItemRule = (folder, item) => {
  const severity = publishedScope(item.status);
  if (!severity) {
    return [];
  }
  return item.sources.flatMap((source, i) =>
    source.archiveUrl
      ? []
      : [
          {
            code: "J034",
            severity,
            file: itemFile(folder),
            path: `sources[${i}].archiveUrl`,
            message: `source "${source.id}" has no archiveUrl`,
            fix: "Save the page on https://web.archive.org/ (or archive.ph) and add the snapshot URL.",
          },
        ],
  );
};

const inputsHaveEvidence: ItemRule = (folder, item) => {
  const severity = publishedScope(item.status);
  const problems: Problem[] = [];
  for (const { path, input } of evidenceInputs(item)) {
    if (input.editorial && input.sources.length > 0) {
      problems.push({
        code: "J036",
        severity: "error",
        file: itemFile(folder),
        path,
        message: "an editorial input must not cite sources",
        fix: "Either remove `editorial: true` (the sources support it) or empty its sources list.",
      });
    }
    if (severity && !input.editorial && input.sources.length === 0) {
      problems.push({
        code: "J035",
        severity,
        file: itemFile(folder),
        path: `${path}.sources`,
        message: "input has no source",
        fix: "Cite at least one source, or mark the input `editorial: true` if it is the editors' judgment.",
      });
    }
  }
  return problems;
};

// --- Scoring consistency -----------------------------------------------------

function levelForRatio(ratio: number): number {
  const index = INTENSITY_RATIO_BAND_LIMITS.findIndex((limit) => ratio <= limit);
  return index === -1 ? INTENSITY_RATIO_BAND_LIMITS.length : index;
}

const intensityMatchesRatio: ItemRule = (folder, item) => {
  const ratio = item.intensity.ratio;
  if (ratio === undefined) {
    return [];
  }
  const ratioRange: Rating = typeof ratio === "number" ? ratio : { min: ratio.min, max: ratio.max };
  const ratioBounds = ratingBounds(ratioRange);
  const expectedLow = levelForRatio(ratioBounds.low);
  const expectedHigh = levelForRatio(ratioBounds.high);
  const value = ratingBounds(item.intensity.value);
  if (value.high >= expectedLow && value.low <= expectedHigh) {
    return [];
  }
  const expected =
    expectedLow === expectedHigh ? `${expectedLow}` : `${expectedLow}–${expectedHigh}`;
  return [
    {
      code: "J040",
      severity: "warning",
      file: itemFile(folder),
      path: "intensity.value",
      message: `intensity does not match its ratio: the ratio band suggests level ${expected}`,
      fix: "Adjust the value to the ratio band (methodology 3.2), or explain the difference in the justification.",
    },
  ];
};

const intensity4IsPlausible: ItemRule = (folder, item) => {
  const reachesFour = ratingBounds(item.intensity.value).high === 4;
  const placeCount = placeCountBounds(item.presence).point;
  return reachesFour && placeCount > INTENSITY_4_MAX_PLACE_COUNT
    ? [
        {
          code: "J041",
          severity: "warning",
          file: itemFile(folder),
          path: "intensity.value",
          message: `intensity 4 ("elsewhere only traces") with a place count of ${placeCount}`,
          fix: "Double-check the intensity or the presence levels; they contradict each other.",
        },
      ]
    : [];
};

function isOlderVersion(version: string, current: string): boolean {
  const [major = 0, minor = 0] = version.split(".").map(Number);
  const [currentMajor = 0, currentMinor = 0] = current.split(".").map(Number);
  return major < currentMajor || (major === currentMajor && minor < currentMinor);
}

const reviewIsCurrent: ItemRule = (folder, item, { options }) => {
  const problems: Problem[] = [];
  const file = itemFile(folder);
  if (item.lastReviewed > options.today) {
    problems.push({
      code: "J044",
      severity: "error",
      file,
      path: "lastReviewed",
      message: `lastReviewed ${item.lastReviewed} is in the future`,
      fix: "Use the date the item was actually reviewed.",
    });
  }
  const severity = publishedScope(item.status);
  if (!severity) {
    return problems;
  }
  if (isOlderVersion(item.methodologyVersion, METHODOLOGY_VERSION)) {
    problems.push({
      code: "J042",
      severity: "warning",
      file,
      path: "methodologyVersion",
      message: `reviewed against methodology ${item.methodologyVersion}; current is ${METHODOLOGY_VERSION}`,
      fix: "Review the inputs against the current methodology, then update methodologyVersion.",
    });
  }
  const oldestAllowed = `${Number(options.today.slice(0, 4)) - REVIEW_MAX_AGE_YEARS}${options.today.slice(4)}`;
  if (item.lastReviewed < oldestAllowed) {
    problems.push({
      code: "J043",
      severity: "warning",
      file,
      path: "lastReviewed",
      message: `last reviewed more than ${REVIEW_MAX_AGE_YEARS} years ago`,
      fix: "Check that the facts and sources still hold, then update lastReviewed.",
    });
  }
  return problems;
};

// --- Locales -----------------------------------------------------------------

const localeFilesAreConsistent = (folder: ItemFolder): Problem[] => {
  const problems: Problem[] = [];
  if (!folder.fileNames.includes(`${defaultLocale}.md`)) {
    problems.push({
      code: "J050",
      severity: "error",
      file: `${folder.dir}/${defaultLocale}.md`,
      message: `missing ${defaultLocale}.md`,
      fix: `Create ${defaultLocale}.md; the default locale is required.`,
    });
  }
  if (folder.texts.length > 0) {
    const originals = folder.texts.filter((t) => t.text.translationStatus === "original");
    if (originals.length !== 1) {
      problems.push({
        code: "J051",
        severity: "error",
        file: folder.texts[0]?.file ?? folder.dir,
        path: "translationStatus",
        message: `${originals.length} locale files are marked "original"; exactly one must be`,
        fix: 'Mark the language the item was written in as "original" and the others as "machine" or "reviewed".',
      });
    }
  }
  const reference = folder.texts.find((t) => t.locale === defaultLocale) ?? folder.texts[0];
  if (reference) {
    const keysOf = (text: (typeof folder.texts)[number]) =>
      [
        ...Object.keys(text.text),
        ...Object.keys(text.text.presenceNotes ?? {}).map((k) => `presenceNotes.${k}`),
        ...Object.keys(text.text.subdivisionNotes ?? {}).map((k) => `subdivisionNotes.${k}`),
      ].sort();
    const referenceKeys = keysOf(reference);
    for (const text of folder.texts) {
      if (text === reference) {
        continue;
      }
      const keys = keysOf(text);
      const missing = referenceKeys.filter((k) => !keys.includes(k));
      const extra = keys.filter((k) => !referenceKeys.includes(k));
      if (missing.length > 0 || extra.length > 0) {
        const details = [
          missing.length > 0 ? `missing ${missing.join(", ")}` : "",
          extra.length > 0 ? `extra ${extra.join(", ")}` : "",
        ]
          .filter(Boolean)
          .join("; ");
        problems.push({
          code: "J052",
          severity: "error",
          file: text.file,
          message: `keys differ from ${reference.file}: ${details}`,
          fix: "Every locale file must have the same keys. Translate the missing ones or remove the extra ones.",
        });
      }
    }
  }
  return problems;
};

const bodiesAreWellFormed: ItemRule = (folder, _item, { itemIds }) =>
  folder.texts.flatMap((text) => {
    const problems: Problem[] = [];
    for (const id of extractItemLinks(text.body)) {
      if (!itemIds.has(id)) {
        problems.push({
          code: "J054",
          severity: "error",
          file: text.file,
          message: `link to unknown item "jabuticaba:${id}"`,
          fix: "Use the id of an existing item (its folder name in content/jabuticabas/).",
        });
      }
    }
    for (const url of extractExternalLinks(text.body)) {
      problems.push({
        code: "J055",
        severity: "warning",
        file: text.file,
        message: `external link ${url}`,
        fix: "If it supports a claim, add it to sources in item.json and cite it with [@id] instead.",
      });
    }
    if (hasH1Heading(text.body)) {
      problems.push({
        code: "J056",
        severity: "error",
        file: text.file,
        message: "the body contains a level-1 (#) heading",
        fix: "Start headings at ##; the page renders the title as the only h1.",
      });
    }
    return problems;
  });

// --- Environment -------------------------------------------------------------

const noMocksInProduction: SnapshotRule = (snapshot, options) =>
  options.production
    ? snapshot.items
        .filter((folder) => folder.item?.status === "mock")
        .map((folder) => ({
          code: "J060",
          severity: "error" as const,
          file: itemFile(folder),
          path: "status",
          message: "mock items are not allowed in a production build",
          fix: "Replace the mock with researched data (status draft or published), or delete the item.",
        }))
    : [];

// --- Runner ------------------------------------------------------------------

const itemRules: ItemRule[] = [
  folderMatchesId,
  slugsAreNotReserved,
  relatedItemsExist,
  placesAreValid,
  placesAreMappable,
  levelRangesAreOrdered,
  exportsArePresent,
  subdivisionCountriesArePresent,
  noteKeysExist,
  citedSourcesExist,
  everySourceIsCited,
  sourceIdsAreUnique,
  mockUrlsMatchStatus,
  sourcesAreArchived,
  imageIsConsistent,
  inputsHaveEvidence,
  intensityMatchesRatio,
  intensity4IsPlausible,
  reviewIsCurrent,
  bodiesAreWellFormed,
];

const snapshotRules: SnapshotRule[] = [uniqueSlugs, noMocksInProduction];

/** Runs every rule. Items whose item.json failed to parse only get file-level checks. */
export function runRules(snapshot: ContentSnapshot, options: ValidationOptions): Problem[] {
  const context: RuleContext = {
    snapshot,
    options,
    itemIds: new Set(snapshot.items.flatMap((f) => (f.item ? [f.item.id] : []))),
    placeCodes: new Set(snapshot.places.map((p) => p.code)),
  };
  const problems: Problem[] = [];
  for (const folder of snapshot.items) {
    problems.push(...onlyAllowedFiles(folder), ...localeFilesAreConsistent(folder));
    if (folder.item) {
      for (const rule of itemRules) {
        problems.push(...rule(folder, folder.item, context));
      }
    }
  }
  for (const rule of snapshotRules) {
    problems.push(...rule(snapshot, options));
  }
  return problems;
}
