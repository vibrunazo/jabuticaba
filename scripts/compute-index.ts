/**
 * `pnpm index [--check]`: computes the Jabuticaba Index for every valid item and
 * writes data/index-results.csv (or, with --check, verifies it is up to date).
 */
import { loadContent } from "../src/content-files/load.ts";
import type { Item } from "../src/schema/item.ts";
import { computeResults, toCsv } from "../src/scoring/results-csv.ts";
import { hasFlag, REPO_ROOT, writeOrCheck } from "./cli.ts";

const RESULTS_FILE = "data/index-results.csv";

const { snapshot, problems } = loadContent(REPO_ROOT);
if (problems.length > 0) {
  console.warn(
    `${problems.length} content files failed to load; run \`pnpm validate\` for details.`,
  );
}
const items = snapshot.items.flatMap((folder): Item[] => (folder.item ? [folder.item] : []));
const results = computeResults(items);

if (!hasFlag("--check")) {
  console.table(
    results.map(({ rank, id, status, result, evidenceGrade }) => ({
      rank,
      id,
      status,
      score: `${result.score.point}% (${result.score.low}–${result.score.high})`,
      evidence: evidenceGrade,
    })),
  );
}

if (!writeOrCheck(RESULTS_FILE, toCsv(results), "pnpm index")) {
  process.exitCode = 1;
}
