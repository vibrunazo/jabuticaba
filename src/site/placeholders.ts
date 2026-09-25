/**
 * Fills {{NAME}} placeholders in rendered page HTML with values computed from the
 * scoring constants, so fixed pages (like the methodology) can never quote a
 * number that differs from the code. Pure functions.
 */
import { formatNumber } from "../i18n/format.ts";
import type { Locale } from "../i18n/ui.ts";
import {
  EVIDENCE_GRADE_THRESHOLDS,
  EXPORT_WEIGHT_FACTOR,
  HIDDEN_JABUTICABA_MAX_AWARENESS,
  HIDDEN_JABUTICABA_MIN_SCORE,
  INTENSITY_4_MAX_PLACE_COUNT,
  INTENSITY_RATIO_BAND_LIMITS,
  MAX_INTENSITY_CREDIT,
  METHODOLOGY_VERSION,
  PRESENCE_WEIGHTS,
  SATURATION_PLACE_COUNT,
  SOURCE_STRENGTH,
} from "../scoring/constants.ts";
import { exclusivityFromPlaceCount, scoreFromInputs } from "../scoring/formula.ts";

function gradeThreshold(grade: string): number {
  return EVIDENCE_GRADE_THRESHOLDS.find((t) => t.grade === grade)?.minStrength ?? Number.NaN;
}

/** Every placeholder a page may use, as locale-formatted text. */
export function placeholderValues(locale: Locale): Record<string, string> {
  const n = (value: number, digits = 2) => formatNumber(locale, value, digits);
  const [band1 = 0, band2 = 0, band3 = 0, band4 = 0] = INTENSITY_RATIO_BAND_LIMITS;
  return {
    METHODOLOGY_VERSION,
    WEIGHT_WIDESPREAD: n(PRESENCE_WEIGHTS.widespread),
    WEIGHT_REGIONAL: n(PRESENCE_WEIGHTS.regional),
    WEIGHT_MARGINAL: n(PRESENCE_WEIGHTS.marginal),
    WEIGHT_ABSENT: n(PRESENCE_WEIGHTS.absent),
    EXPORT_WEIGHT_FACTOR: n(EXPORT_WEIGHT_FACTOR),
    SATURATION_PLACE_COUNT: n(SATURATION_PLACE_COUNT, 0),
    FIRST_PLACE_DROP_PERCENT: n(Math.round((1 - exclusivityFromPlaceCount(1)) * 100), 0),
    MAX_INTENSITY_CREDIT: n(MAX_INTENSITY_CREDIT),
    UBIQUITOUS_MAX_SCORE: n(scoreFromInputs(SATURATION_PLACE_COUNT, 4), 0),
    UBIQUITOUS_SCORE_AT_3: n(scoreFromInputs(SATURATION_PLACE_COUNT, 3), 0),
    RATIO_BAND_1: n(band1, 0),
    RATIO_BAND_2: n(band2, 0),
    RATIO_BAND_3: n(band3, 0),
    RATIO_BAND_4: n(band4, 0),
    INTENSITY_4_MAX_PLACE_COUNT: n(INTENSITY_4_MAX_PLACE_COUNT, 0),
    STRENGTH_STRONG: n(SOURCE_STRENGTH.dataset, 0),
    STRENGTH_MEDIUM: n(SOURCE_STRENGTH.news, 0),
    STRENGTH_WEAK: n(SOURCE_STRENGTH.other, 0),
    GRADE_A: n(gradeThreshold("A"), 1),
    GRADE_B: n(gradeThreshold("B"), 1),
    GRADE_C: n(gradeThreshold("C"), 1),
    HIDDEN_MAX_AWARENESS: n(HIDDEN_JABUTICABA_MAX_AWARENESS, 0),
    HIDDEN_MIN_SCORE: n(HIDDEN_JABUTICABA_MIN_SCORE, 0),
  };
}

export interface FilledHtml {
  html: string;
  /** Placeholders found in the text but not defined; the page build fails on these. */
  unknown: string[];
}

export function fillPlaceholders(
  html: string,
  values: Readonly<Record<string, string>>,
): FilledHtml {
  const unknown: string[] = [];
  const filled = html.replace(/\{\{\s*([A-Z0-9_]+)\s*\}\}/g, (original, name: string) => {
    const value = values[name];
    if (value === undefined) {
      unknown.push(name);
      return original;
    }
    return value;
  });
  return { html: filled, unknown };
}
