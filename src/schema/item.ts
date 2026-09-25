/**
 * Schema of `content/jabuticabas/<id>/item.json`.
 * Spec: docs/design/02-content-schema.md, sections 4 and 6.
 */
import { z } from "zod";
import {
  dateSchema,
  evidenceShape,
  idSchema,
  levelRangeSchema,
  PRESENCE_LEVELS,
  partialDateSchema,
  placeCodeSchema,
  ratingSchema,
  subdivisionCodeSchema,
} from "./shared.ts";

export const ITEM_SCHEMA_REFERENCE = "../../../schemas/item.schema.json";

export const ITEM_STATUSES = ["mock", "draft", "published"] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export const CATEGORIES = [
  "nature",
  "food",
  "home",
  "urban",
  "culture",
  "politics",
  "justice",
  "economy",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const SOURCE_TYPES = [
  "dataset",
  "government",
  "academic",
  "organization",
  "reference",
  "news",
  "other",
] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

const yearRangeSchema = z.union([
  z.int(),
  z
    .strictObject({ min: z.int(), max: z.int() })
    .refine((range) => range.min < range.max, { error: "min must be lower than max" }),
]);

const positiveRangeSchema = z.union([
  z.number().positive(),
  z
    .strictObject({ min: z.number().positive(), max: z.number().positive() })
    .refine((range) => range.min < range.max, { error: "min must be lower than max" }),
]);

const httpsUrlSchema = z.url({ protocol: /^https$/, error: "must be a full https:// URL" });

export const presenceEntrySchema = z.strictObject({
  place: placeCodeSchema,
  level: levelRangeSchema(PRESENCE_LEVELS),
  /** Present there only because Brazil exported it (products, restaurants, diaspora). */
  exported: z.literal(true).optional(),
  ...evidenceShape,
});
export type PresenceEntry = z.infer<typeof presenceEntrySchema>;

export const subdivisionEntrySchema = z.strictObject({
  subdivision: subdivisionCodeSchema,
  level: levelRangeSchema(PRESENCE_LEVELS),
  ...evidenceShape,
});
export type SubdivisionEntry = z.infer<typeof subdivisionEntrySchema>;

export const intensityInputSchema = z.strictObject({
  value: ratingSchema,
  ratio: positiveRangeSchema.optional(),
  ...evidenceShape,
});

export const awarenessInputSchema = z.strictObject({
  value: ratingSchema,
  ...evidenceShape,
});

export const sourceSchema = z.strictObject({
  id: idSchema,
  type: z.enum(SOURCE_TYPES),
  title: z.string().min(1),
  publisher: z.string().min(1),
  authors: z.array(z.string().min(1)).min(1).optional(),
  url: httpsUrlSchema,
  archiveUrl: httpsUrlSchema.optional(),
  published: partialDateSchema.optional(),
  accessed: dateSchema,
  language: z.string().regex(/^[a-z]{2,3}(-[A-Z]{2})?$/, {
    error: "must be a BCP 47 language tag, e.g. pt, en, es, pt-PT",
  }),
  locator: z.string().min(1).optional(),
});
export type Source = z.infer<typeof sourceSchema>;

export const itemSchema = z.strictObject({
  $schema: z.literal(ITEM_SCHEMA_REFERENCE),
  id: idSchema,
  status: z.enum(ITEM_STATUSES),
  methodologyVersion: z.string().regex(/^\d+\.\d+$/, { error: "must look like 0.1" }),
  lastReviewed: dateSchema,
  category: z.enum(CATEGORIES),
  since: yearRangeSchema.optional(),
  presence: z.array(presenceEntrySchema),
  subdivisions: z.array(subdivisionEntrySchema).optional(),
  intensity: intensityInputSchema,
  awareness: awarenessInputSchema,
  sources: z.array(sourceSchema),
  related: z.array(idSchema).optional(),
});
export type Item = z.infer<typeof itemSchema>;
