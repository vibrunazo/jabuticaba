import { describe, expect, it } from "vitest";
import {
  countWords,
  extractCitations,
  extractExternalLinks,
  extractH2Headings,
  extractItemLinks,
  hasH1Heading,
  parseFrontmatter,
} from "./markdown.ts";

describe("parseFrontmatter", () => {
  it("parses YAML and returns the body", () => {
    const result = parseFrontmatter('---\ntitle: "Capivara"\n---\n\nTexto.\n');
    expect(result).toEqual({ ok: true, data: { title: "Capivara" }, body: "\nTexto.\n" });
  });

  it("accepts Windows line endings", () => {
    const result = parseFrontmatter("---\r\ntitle: x\r\n---\r\nBody");
    expect(result.ok).toBe(true);
  });

  it("fails without a frontmatter block", () => {
    expect(parseFrontmatter("# Title").ok).toBe(false);
  });

  it("fails on invalid YAML, e.g. an unquoted colon", () => {
    expect(parseFrontmatter("---\ntitle: Urnas: o problema\n---\n").ok).toBe(false);
  });
});

describe("extractCitations", () => {
  it("finds single, multiple and located citations", () => {
    const body = "A [@first]. B [@second; @third]. C [@fourth, p. 41].";
    expect(extractCitations(body)).toEqual(["first", "second", "third", "fourth"]);
  });

  it("ignores normal links and code blocks", () => {
    const body = "[text](https://example.org)\n```\n[@in-code]\n```\n";
    expect(extractCitations(body)).toEqual([]);
  });
});

describe("extractItemLinks", () => {
  it("finds jabuticaba: links", () => {
    expect(extractItemLinks("See [capivaras](jabuticaba:capybara).")).toEqual(["capybara"]);
  });
});

describe("extractExternalLinks", () => {
  it("finds Markdown and bare links", () => {
    const body = "[a](https://example.org/a) and http://example.org/b";
    expect(extractExternalLinks(body)).toEqual(["https://example.org/a", "http://example.org/b"]);
  });
});

describe("extractH2Headings", () => {
  it("lists level-2 headings only", () => {
    const body = ["# T", "", "## No Brasil", "", "text", "", "### Sub", "", "## Lá fora "].join(
      "\n",
    );
    expect(extractH2Headings(body)).toEqual(["No Brasil", "Lá fora"]);
  });
});

describe("countWords", () => {
  it("counts words, not headings, citations or URLs", () => {
    const body = [
      "## Título",
      "",
      "Uma frase com três-palavras [@fonte-x] e [link](jabuticaba:item).",
    ].join("\n");
    // Uma, frase, com, três-palavras, e, link
    expect(countWords(body)).toBe(6);
  });
});

describe("hasH1Heading", () => {
  it("detects only level-1 headings", () => {
    expect(hasH1Heading("# Title")).toBe(true);
    expect(hasH1Heading("## Section")).toBe(false);
    expect(hasH1Heading("#hashtag")).toBe(false);
  });
});
