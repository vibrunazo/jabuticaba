/**
 * Plain-text helpers for locale Markdown files. Pure functions: no I/O.
 * Spec: docs/design/02-content-schema.md, section 5.
 */
import { parse as parseYaml } from "yaml";

export type FrontmatterResult =
  | { ok: true; data: unknown; body: string }
  | { ok: false; error: string };

/** Splits `---\n<yaml>\n---\n<body>` and parses the YAML. */
export function parseFrontmatter(fileText: string): FrontmatterResult {
  const text = fileText.replace(/\r\n/g, "\n");
  const match = /^---\n([\s\S]*?)\n---(?:\n|$)/.exec(text);
  if (!match) {
    return { ok: false, error: "file must start with a frontmatter block between --- lines" };
  }
  try {
    const data: unknown = parseYaml(match[1] ?? "");
    return { ok: true, data, body: text.slice(match[0].length) };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `invalid YAML in frontmatter: ${reason}` };
  }
}

/** Removes fenced code blocks, so examples inside them are not treated as content. */
function withoutCodeBlocks(body: string): string {
  return body.replace(/^```[\s\S]*?^```/gm, "");
}

/** Source ids cited with Pandoc syntax: `[@a]`, `[@a; @b]`, `[@a, p. 41]`. */
export function extractCitations(body: string): string[] {
  const ids: string[] = [];
  for (const match of withoutCodeBlocks(body).matchAll(/\[(@[^\]]+)\]/g)) {
    for (const part of (match[1] ?? "").split(";")) {
      const id = part.trim().replace(/^@/, "").split(",")[0]?.trim();
      if (id) {
        ids.push(id);
      }
    }
  }
  return ids;
}

/** Item ids linked with `[text](jabuticaba:<id>)`. */
export function extractItemLinks(body: string): string[] {
  return [...withoutCodeBlocks(body).matchAll(/\]\(jabuticaba:([^)\s]+)\)/g)].map(
    (match) => match[1] ?? "",
  );
}

/** External http(s) URLs, as Markdown links or bare. */
export function extractExternalLinks(body: string): string[] {
  return [...withoutCodeBlocks(body).matchAll(/https?:\/\/[^\s)>\]]+/g)].map((match) => match[0]);
}

export function hasH1Heading(body: string): boolean {
  return /^#[ \t]/m.test(withoutCodeBlocks(body));
}
