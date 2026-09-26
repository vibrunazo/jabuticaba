/**
 * `pnpm research:start <item-id> [--category <category>]`
 *
 * Step 3 of docs/research-protocol.md. Prepares an item folder for real research:
 * - existing mock item: converts it to a draft and deletes all fictional data;
 * - new item: creates a draft from docs/templates/ (needs --category);
 * - in both cases: creates research.md from the template if it doesn't exist.
 * Refuses to touch items that are already drafts or published.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ITEMS_DIR } from "../src/content-files/load.ts";
import { parseFrontmatter } from "../src/content-files/markdown.ts";
import { draftLocaleText, mockToDraft, newDraftItem } from "../src/content-files/research-start.ts";
import { locales } from "../src/i18n/ui.ts";
import {
  CATEGORIES,
  type Category,
  type Item,
  itemSchema,
  RESEARCH_FILE,
} from "../src/schema/item.ts";
import { ID_PATTERN } from "../src/schema/shared.ts";
import { REPO_ROOT } from "./cli.ts";

const TEMPLATES = path.join(REPO_ROOT, "docs/templates");

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const id = process.argv[2];
if (!id || id.startsWith("--") || !ID_PATTERN.test(id)) {
  fail("Usage: pnpm research:start <item-id> [--category <category>]  (id: kebab-case, English)");
}

const today = new Date().toISOString().slice(0, 10);
const dir = path.join(REPO_ROOT, ITEMS_DIR, id);
const itemFile = path.join(dir, "item.json");
const written: string[] = [];

function write(file: string, content: string) {
  writeFileSync(file, content);
  written.push(path.relative(REPO_ROOT, file).replaceAll("\\", "/"));
}

function template(name: string): string {
  return readFileSync(path.join(TEMPLATES, name), "utf8");
}

if (existsSync(itemFile)) {
  const parsed = itemSchema.safeParse(JSON.parse(readFileSync(itemFile, "utf8")));
  if (!parsed.success) {
    fail(`${ITEMS_DIR}/${id}/item.json is invalid; run \`pnpm validate\` first.`);
  }
  const item: Item = parsed.data;
  if (item.status !== "mock") {
    fail(
      `"${id}" is already ${item.status}; research continues in place (see docs/research-protocol.md).`,
    );
  }
  write(itemFile, `${JSON.stringify(mockToDraft(item, today), null, 2)}\n`);
  for (const locale of locales) {
    const file = path.join(dir, `${locale}.md`);
    if (existsSync(file)) {
      const previous = parseFrontmatter(readFileSync(file, "utf8"));
      const data = previous.ok ? (previous.data as Record<string, unknown>) : undefined;
      write(file, draftLocaleText(template(`${locale}.md`), data));
    }
  }
} else {
  const category = argument("--category");
  if (!category || !(CATEGORIES as readonly string[]).includes(category)) {
    fail(`New item: pass --category, one of: ${CATEGORIES.join(", ")}`);
  }
  mkdirSync(dir, { recursive: true });
  write(itemFile, `${JSON.stringify(newDraftItem(id, category as Category, today), null, 2)}\n`);
  write(path.join(dir, "pt.md"), draftLocaleText(template("pt.md"), { slug: id, title: id }));
}

const researchFile = path.join(dir, RESEARCH_FILE);
if (!existsSync(researchFile)) {
  write(researchFile, template("research.md").replace("<item-id>", id));
}

console.log(`Prepared "${id}" for research:\n${written.map((f) => `  ${f}`).join("\n")}`);
console.log(
  "\nNext (docs/research-protocol.md): agree on the definition, research into research.md,\nthen fill item.json and write pt.md/en.md. `pnpm validate` lists what is still missing.",
);
