import { describe, expect, it } from "vitest";
import { renderCitations, resolveItemLinks } from "./citations.ts";

const numbers = new Map([
  ["census", 1],
  ["survey", 2],
]);

describe("renderCitations", () => {
  it("numbers a single citation", () => {
    expect(renderCitations("<p>Fact [@census].</p>", numbers)).toBe(
      '<p>Fact <sup class="citation">[<a href="#source-census">1</a>]</sup>.</p>',
    );
  });

  it("handles several sources and locators", () => {
    expect(renderCitations("[@census; @survey]", numbers)).toBe(
      '<sup class="citation">[<a href="#source-census">1</a>, <a href="#source-survey">2</a>]</sup>',
    );
    expect(renderCitations("[@survey, p. 12]", numbers)).toBe(
      '<sup class="citation">[<a href="#source-survey">2</a>, p. 12]</sup>',
    );
  });

  it("leaves unknown ids and ordinary brackets alone", () => {
    expect(renderCitations("[@ghost]", numbers)).toBe("[@ghost]");
    expect(renderCitations("[not a citation]", numbers)).toBe("[not a citation]");
  });
});

describe("resolveItemLinks", () => {
  it("rewrites known ids only", () => {
    const html = '<a href="jabuticaba:capybara">x</a> <a href="jabuticaba:ghost">y</a>';
    const hrefFor = (id: string) => (id === "capybara" ? "/capivara/" : undefined);
    expect(resolveItemLinks(html, hrefFor)).toBe(
      '<a href="/capivara/">x</a> <a href="jabuticaba:ghost">y</a>',
    );
  });
});
