/**
 * `pnpm validate [--production]`: checks every content file.
 * Rules: docs/design/02-content-schema.md, section 10. Exits with 1 on any error.
 */
import { loadContent } from "../src/content-files/load.ts";
import { runRules } from "../src/validation/rules.ts";
import type { Problem } from "../src/validation/types.ts";
import { hasFlag, REPO_ROOT } from "./cli.ts";

function format(problem: Problem): string {
  const location = problem.path ? `${problem.file} ${problem.path}` : problem.file;
  return `${problem.severity.toUpperCase()} ${problem.code} ${location}: ${problem.message}\n      Fix: ${problem.fix}`;
}

const production = hasFlag("--production");
const today = new Date().toISOString().slice(0, 10);
const { snapshot, problems: loadProblems } = loadContent(REPO_ROOT);
const problems = [...loadProblems, ...runRules(snapshot, { production, today })].sort(
  (a, b) => a.file.localeCompare(b.file) || a.code.localeCompare(b.code),
);

for (const problem of problems) {
  console.log(format(problem));
}

const errors = problems.filter((p) => p.severity === "error").length;
const warnings = problems.length - errors;
console.log(
  `\nValidated ${snapshot.items.length} items${production ? " (production)" : ""}: ${errors} errors, ${warnings} warnings.`,
);
process.exitCode = errors > 0 ? 1 : 0;
