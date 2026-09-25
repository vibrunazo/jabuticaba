/**
 * Evidence grade and other derived, non-scored attributes.
 * Spec: docs/design/01-index-methodology-v0.md, sections 6 and 7.
 */
import type { Item } from "../schema/item.ts";
import {
  EVIDENCE_GRADE_THRESHOLDS,
  HIDDEN_JABUTICABA_MAX_AWARENESS,
  HIDDEN_JABUTICABA_MIN_SCORE,
  SOURCE_STRENGTH,
} from "./constants.ts";
import { computeItemScore, ratingBounds } from "./formula.ts";

export type EvidenceGrade = "A" | "B" | "C" | "D";

interface EvidenceInput {
  sources: readonly string[];
  editorial?: true | undefined;
}

/** The strongest source cited by one input; 0 when editorial or unsourced. */
function inputStrength(input: EvidenceInput, strengthById: ReadonlyMap<string, number>): number {
  if (input.editorial) {
    return 0;
  }
  let strongest = 0;
  for (const sourceId of input.sources) {
    strongest = Math.max(strongest, strengthById.get(sourceId) ?? 0);
  }
  return strongest;
}

/** Methodology 6: graded from the mean strength of every presence entry plus intensity. */
export function computeEvidenceGrade(
  item: Pick<Item, "presence" | "intensity" | "sources">,
): EvidenceGrade {
  const strengthById = new Map(
    item.sources.map((source) => [source.id, SOURCE_STRENGTH[source.type]]),
  );
  const inputs: EvidenceInput[] = [...item.presence, item.intensity];
  const total = inputs.reduce((sum, input) => sum + inputStrength(input, strengthById), 0);
  const mean = total / inputs.length;
  for (const threshold of EVIDENCE_GRADE_THRESHOLDS) {
    if (mean >= threshold.minStrength) {
      return threshold.grade;
    }
  }
  return "D";
}

/**
 * Methodology 7.1: the whole awareness range is at or below the threshold, and the
 * score is above the minimum (a barely-Brazilian thing can't be a hidden jabuticaba).
 */
export function isHiddenJabuticaba(
  item: Pick<Item, "awareness" | "presence" | "intensity">,
): boolean {
  return (
    ratingBounds(item.awareness.value).high <= HIDDEN_JABUTICABA_MAX_AWARENESS &&
    computeItemScore(item).score.point > HIDDEN_JABUTICABA_MIN_SCORE
  );
}
