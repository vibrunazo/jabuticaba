/**
 * Turns the Pandoc-style citations and `jabuticaba:` links of rendered article
 * HTML into numbered references and real URLs. Pure functions.
 * Spec: docs/design/02-content-schema.md, section 5 (body).
 *
 * Astro renders the Markdown first; its HTML keeps `[@id]` as plain text and
 * `jabuticaba:<id>` as an href, so both are rewritten here.
 */

export function sourceAnchor(sourceId: string): string {
  return `source-${sourceId}`;
}

interface CitationPart {
  id: string;
  locator: string | undefined;
}

function parseCitation(inner: string): CitationPart[] {
  return inner.split(";").map((part) => {
    const trimmed = part.trim().replace(/^@/, "");
    const comma = trimmed.indexOf(",");
    return comma === -1
      ? { id: trimmed, locator: undefined }
      : { id: trimmed.slice(0, comma).trim(), locator: trimmed.slice(comma + 1).trim() };
  });
}

/**
 * `[@a; @b, p. 41]` → `<sup class="citation">[<a href="#source-a">1</a>; <a …>2</a>, p. 41]</sup>`.
 * A citation with an unknown id is left untouched (validation rule J030 reports it).
 */
export function renderCitations(html: string, numbers: ReadonlyMap<string, number>): string {
  return html.replace(/\[(@[^\]<>]+)\]/g, (original, inner: string) => {
    const parts = parseCitation(inner);
    if (parts.some((part) => !numbers.has(part.id))) {
      return original;
    }
    const hasLocator = parts.some((part) => part.locator);
    const links = parts.map((part) => {
      const link = `<a href="#${sourceAnchor(part.id)}">${numbers.get(part.id)}</a>`;
      return part.locator ? `${link}, ${part.locator}` : link;
    });
    return `<sup class="citation">[${links.join(hasLocator ? "; " : ", ")}]</sup>`;
  });
}

/** Rewrites `href="jabuticaba:<id>"` to the item's URL; unknown ids are left untouched. */
export function resolveItemLinks(
  html: string,
  hrefFor: (itemId: string) => string | undefined,
): string {
  return html.replace(/href="jabuticaba:([^"]+)"/g, (original, id: string) => {
    const href = hrefFor(id);
    return href ? `href="${href}"` : original;
  });
}
