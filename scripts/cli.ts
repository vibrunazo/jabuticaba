/** Small helpers shared by the command-line scripts. */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export const REPO_ROOT = path.resolve(import.meta.dirname, "..");

export function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

/**
 * Writes a generated file, or with `--check` only verifies it is up to date.
 * Returns false when the check fails.
 */
export function writeOrCheck(
  relativeFile: string,
  content: string,
  regenerateCommand: string,
): boolean {
  const absolute = path.join(REPO_ROOT, relativeFile);
  if (hasFlag("--check")) {
    const current = existsSync(absolute)
      ? readFileSync(absolute, "utf8").replace(/\r\n/g, "\n")
      : "";
    if (current !== content) {
      console.error(
        `${relativeFile} is out of date. Run \`${regenerateCommand}\` and include the result.`,
      );
      return false;
    }
    console.log(`${relativeFile} is up to date.`);
    return true;
  }
  writeFileSync(absolute, content);
  console.log(`Wrote ${relativeFile}.`);
  return true;
}
