/**
 * Builds data/index-results.csv. Pure functions: no I/O.
 * Spec: docs/design/02-content-schema.md, sections 2, 8 and 9.
 */
import type { Item, ItemStatus } from "../schema/item.ts";
import { METHODOLOGY_VERSION } from "./constants.ts";
import { computeEvidenceGrade, type EvidenceGrade } from "./evidence.ts";
import { computeItemScore, type ItemScore } from "./formula.ts";

export interface ItemResult {
  rank: number;
  id: string;
  status: ItemStatus;
  result: ItemScore;
  evidenceGrade: EvidenceGrade;
}

/** Ranked by score (highest first), ties broken by id for a stable order. */
export function computeResults(items: readonly Item[]): ItemResult[] {
  return items
    .map((item) => ({
      id: item.id,
      status: item.status,
      result: computeItemScore(item),
      evidenceGrade: computeEvidenceGrade(item),
    }))
    .sort((a, b) => b.result.score.point - a.result.score.point || a.id.localeCompare(b.id))
    .map((row, index) => ({ rank: index + 1, ...row }));
}

const COLUMNS = [
  "rank",
  "id",
  "status",
  "score",
  "scoreLow",
  "scoreHigh",
  "exclusivity",
  "placeCount",
  "intensity",
  "evidenceGrade",
  "methodologyVersion",
] as const;

/** Fixed decimals keep the file identical across machines. */
function decimal(value: number): string {
  return value.toFixed(4);
}

export function toCsv(results: readonly ItemResult[]): string {
  const lines = results.map(({ rank, id, status, result, evidenceGrade }) =>
    [
      rank,
      id,
      status,
      result.score.point,
      result.score.low,
      result.score.high,
      decimal(result.exclusivity.point),
      decimal(result.placeCount.point),
      decimal(result.intensity.point),
      evidenceGrade,
      METHODOLOGY_VERSION,
    ].join(","),
  );
  return `${[COLUMNS.join(","), ...lines].join("\n")}\n`;
}
