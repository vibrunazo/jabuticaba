/**
 * Building blocks shared by the content schemas.
 * Spec: docs/design/02-content-schema.md, section 3.
 *
 * This module must not import anything from Astro: it also runs in plain Node
 * (validation and index scripts).
 */
import { z } from "zod";

export const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const idSchema = z.string().max(60).regex(ID_PATTERN, {
  error: "must be kebab-case ASCII: lowercase letters, digits and single hyphens",
});

export const dateSchema = z.iso.date({ error: "must be a date in YYYY-MM-DD format" });

export const partialDateSchema = z.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, {
  error: "must be YYYY, YYYY-MM or YYYY-MM-DD",
});

export const placeCodeSchema = z.string().regex(/^[A-Z]{2}$/, {
  error: "must be an ISO 3166-1 alpha-2 code in uppercase, e.g. PY",
});

export const subdivisionCodeSchema = z.string().regex(/^[A-Z]{2}-[A-Z0-9]{1,3}$/, {
  error: "must be an ISO 3166-2 code in uppercase, e.g. US-LA",
});

export const RATING_MIN = 0;
export const RATING_MAX = 4;

const ratingValueSchema = z.int().min(RATING_MIN).max(RATING_MAX);

/** A 0–4 rating, or a `{ min, max }` range of ratings. */
export const ratingSchema = z.union([
  ratingValueSchema,
  z
    .strictObject({ min: ratingValueSchema, max: ratingValueSchema })
    .refine((range) => range.min < range.max, { error: "min must be lower than max" }),
]);
export type Rating = z.infer<typeof ratingSchema>;

/**
 * Presence levels, ordered from lowest to highest. The order matters for ranges.
 * Whether a presence is local or a Brazilian export is a separate flag (`exported`).
 */
export const PRESENCE_LEVELS = ["absent", "marginal", "regional", "widespread"] as const;
export type PresenceLevel = (typeof PRESENCE_LEVELS)[number];

/**
 * A level, or a `[low, high]` pair of levels.
 * The order of the pair is checked by validation rule J023, not here.
 */
export function levelRangeSchema<const T extends readonly [string, ...string[]]>(levels: T) {
  const level = z.enum(levels);
  return z.union([level, z.tuple([level, level])]);
}
export type LevelRange = PresenceLevel | readonly [PresenceLevel, PresenceLevel];

/** Fields shared by every input that needs evidence. */
export const evidenceShape = {
  sources: z.array(idSchema),
  editorial: z.literal(true).optional(),
};
