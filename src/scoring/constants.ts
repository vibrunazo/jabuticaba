/**
 * Every tunable number of the Jabuticaba Index lives in this file.
 * Spec: docs/design/01-index-methodology-v0.md.
 *
 * After changing a value: run `pnpm index` to regenerate data/index-results.csv,
 * and update the methodology document (and its version) to match.
 */
import type { SourceType } from "../schema/item.ts";
import type { PresenceLevel } from "../schema/shared.ts";

/** Version of the methodology implemented by this code. Methodology doc, title. */
export const METHODOLOGY_VERSION = "0.1";

/** Places at which an item is "fully common" (exclusivity = 0). Methodology 3.1. */
export const SATURATION_PLACE_COUNT = 100;

/** How much each presence level adds to the place count. Methodology 3.1. */
export const PRESENCE_WEIGHTS = {
  absent: 0,
  imported: 0,
  marginal: 0.1,
  regional: 0.5,
  widespread: 1,
} as const satisfies Record<PresenceLevel, number>;

/** Highest rarity a completely non-exclusive item can reach through intensity. Methodology 4. */
export const MAX_INTENSITY_CREDIT = 0.5;

/**
 * Upper bound of the `intensity.ratio` band for levels 0 to 3; level 4 is above
 * the last bound. E.g. a ratio of 3.2 falls in (2, 5], so level 2. Methodology 3.2.
 */
export const INTENSITY_RATIO_BAND_LIMITS = [1, 2, 5, 20] as const;

/** Warn when intensity reaches 4 and placeCount exceeds this. Methodology 3.2. */
export const INTENSITY_4_MAX_PLACE_COUNT = 20;

/** Strength of each source type, for the evidence grade. Methodology 6. */
export const SOURCE_STRENGTH = {
  dataset: 3,
  government: 3,
  academic: 3,
  organization: 2,
  reference: 2,
  news: 2,
  other: 1,
} as const satisfies Record<SourceType, number>;

/** Minimum mean input strength for each grade, best first; below all of them is "D". */
export const EVIDENCE_GRADE_THRESHOLDS = [
  { grade: "A", minStrength: 2.5 },
  { grade: "B", minStrength: 2.0 },
  { grade: "C", minStrength: 1.0 },
] as const;

/**
 * "Hidden jabuticaba": the awareness range reaches no higher than MAX_AWARENESS,
 * and the score (point estimate) is above MIN_SCORE, so it really is a jabuticaba.
 * Methodology 7.1.
 */
export const HIDDEN_JABUTICABA_MAX_AWARENESS = 1;
export const HIDDEN_JABUTICABA_MIN_SCORE = 50;
