/**
 * The Jabuticaba Index formula. Pure functions only: no I/O.
 * Spec: docs/design/01-index-methodology-v0.md, sections 3–5.
 */
import type { Item, PresenceEntry } from "../schema/item.ts";
import { type PresenceLevel, RATING_MAX, type Rating } from "../schema/shared.ts";
import {
  EXPORT_WEIGHT_FACTOR,
  MAX_INTENSITY_CREDIT,
  PRESENCE_WEIGHTS,
  SATURATION_PLACE_COUNT,
} from "./constants.ts";

/** A value known only within bounds. `point` is the best estimate. */
export interface Bounds {
  low: number;
  point: number;
  high: number;
}

export interface ItemScore {
  placeCount: Bounds;
  intensity: Bounds;
  exclusivity: Bounds;
  /** Score from 0 to 100: `point` is the published score, low/high its plausibility range. */
  score: Bounds;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Methodology 3.1: 1 when no other place has it, 0 at SATURATION_PLACE_COUNT or more. */
export function exclusivityFromPlaceCount(placeCount: number): number {
  return clamp(1 - Math.log(1 + placeCount) / Math.log(1 + SATURATION_PLACE_COUNT), 0, 1);
}

/** Methodology 4. `intensity` is the 0–4 rating (may be fractional, e.g. a midpoint). */
export function rarity(exclusivity: number, intensity: number): number {
  const normalizedIntensity = intensity / RATING_MAX;
  return exclusivity + MAX_INTENSITY_CREDIT * normalizedIntensity * (1 - exclusivity);
}

/** Methodology 4: the 0–100 score for one pair of inputs. */
export function scoreFromInputs(placeCount: number, intensity: number): number {
  return Math.round(100 * rarity(exclusivityFromPlaceCount(placeCount), intensity));
}

function levelEnds(level: PresenceEntry["level"]): readonly [PresenceLevel, PresenceLevel] {
  return typeof level === "string" ? [level, level] : level;
}

/** Methodology 3.1: what one place adds to the place count. */
export function presenceWeight(level: PresenceLevel, exported: boolean): number {
  return PRESENCE_WEIGHTS[level] * (exported ? EXPORT_WEIGHT_FACTOR : 1);
}

/** Methodology 3.1 and 5: the place count, with ranges resolved to low/point/high. */
export function placeCountBounds(presence: readonly PresenceEntry[]): Bounds {
  let low = 0;
  let high = 0;
  for (const entry of presence) {
    const [lowLevel, highLevel] = levelEnds(entry.level);
    const exported = entry.exported === true;
    low += presenceWeight(lowLevel, exported);
    high += presenceWeight(highLevel, exported);
  }
  return { low, point: (low + high) / 2, high };
}

export function ratingBounds(rating: Rating): Bounds {
  if (typeof rating === "number") {
    return { low: rating, point: rating, high: rating };
  }
  return { low: rating.min, point: (rating.min + rating.max) / 2, high: rating.max };
}

/**
 * Methodology 5: the formula is monotone (the score falls as placeCount rises and
 * rises with intensity), so two evaluations give the exact bounds.
 */
export function computeItemScore(item: Pick<Item, "presence" | "intensity">): ItemScore {
  const placeCount = placeCountBounds(item.presence);
  const intensity = ratingBounds(item.intensity.value);
  return {
    placeCount,
    intensity,
    exclusivity: {
      low: exclusivityFromPlaceCount(placeCount.high),
      point: exclusivityFromPlaceCount(placeCount.point),
      high: exclusivityFromPlaceCount(placeCount.low),
    },
    score: {
      low: scoreFromInputs(placeCount.high, intensity.low),
      point: scoreFromInputs(placeCount.point, intensity.point),
      high: scoreFromInputs(placeCount.low, intensity.high),
    },
  };
}
