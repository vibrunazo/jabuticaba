# Editorial guide

How every item's text is researched and written. Read this before writing or
rewriting `research.md`, `pt.md` or `en.md`. Templates: `docs/templates/`.

## 1. The two layers

| File | Audience | Language | Contains |
|------|----------|----------|----------|
| `research.md` | us (internal, not published) | English | Every fact the text may use, each with its source and a supporting quote; hypotheses with evidence; open questions; dead ends. |
| `pt.md`, `en.md` | readers | pt-BR, English | The published text, written **only** from `research.md` and `item.json`. |

**Rule:** every factual sentence in the prose must trace back to a claim in
`research.md`. If a fact is not there, it is not in the prose: go back and
research it first. This is what lets us rewrite the prose (new style, new
sections, a new language) without redoing research, and without inventing
anything along the way.

Structured facts (presence per country, ratings) live in `item.json`. `research.md`
explains them and holds everything else.

## 2. Voice

The site presents itself as a serious data institute, and it is one: the facts are
real. The comedy comes from treating everyday Brazilian things with full
institutional gravity, and from what the facts reveal. Not from invented facts, and
not from mocking people.

- **Deadpan.** Institutional tone, understatement, precise wording. No exclamation
  marks, no emoji, no "Você sabia?" clickbait, no memes.
- **Dosage:** at most one sharp line every other paragraph. The rest is plain,
  informative, well-sourced text. A reader should learn something from every
  paragraph and laugh at some of them.
- **Jokes may be irony or obvious exaggeration, never a factual-sounding claim.**
  "Em Portugal, presume-se que as crianças simplesmente evitam janelas." works
  because nobody reads it as data. "Em Portugal, 12% das crianças caem de
  janelas" is a fake fact and is forbidden, however funny.
- **Punch at situations, institutions and absurdities, never at groups of people,**
  regions, classes or individuals. The joke is on the precatório, not on the
  creditor.
- **Political neutrality.** Contested topics (elections, courts, public debt) get
  facts, sources and the strongest version of each position. The deadpan applies to
  everyone equally.
- **Hedging is part of the voice.** "Segundo o IBGE…", "estima-se…", "não
  encontramos dados sobre…". Saying what we don't know is on-brand for an institute.

## 3. Structure of the published text

Every item uses the same sections, in this order. The validator checks the headings
(rule J057) for draft and published items.

| # | Heading (pt / en) | Required | Length (words) | Content |
|---|-------------------|----------|----------------|---------|
| — | *(no heading: opening)* | yes | 40–100 | What it is and why it is on the list. The hook. |
| 1 | `## No Brasil` / `## In Brazil` | yes | 80–200 | How widespread, since when, who uses it; the key numbers. |
| 2 | `## Lá fora` / `## Abroad` | yes | 80–250 | Where else it exists and how; **where it doesn't, what people do instead.** |
| 3 | `## Por quê?` / `## Why?` | yes | 100–300 | Hypotheses about the root causes, tested against the evidence (below). |
| 4 | `## Choque cultural` / `## Culture shock` | no | 50–150 | Real, sourced reactions of foreigners in Brazil and Brazilians abroad. |
| 5 | `## Veredito` / `## Verdict` | yes | 30–80 | Short closing that ties the text to the score. |

Total: roughly 300–700 words per language (warning J058 outside that range).
`###` subheadings are allowed inside sections (e.g. one per hypothesis). No other
`##` headings, and never a `#` (the page title is the only h1).

### Opening
Start with the thing itself, concretely. End with why it earns a place in the index.
The item's `summary` is the one-line version; the opening is the paragraph version.

### No Brasil
Numbers first: how many, how common, since when, where in the country. Regional
differences belong here (and in `subdivisions` in `item.json`).

### Lá fora
This is usually the most surprising section, so give it room. Two halves:
1. **Where it exists abroad, and in what form.** Neighbors, the Lusophone world,
   exports (see the export rule in the methodology).
2. **Where it doesn't, what do people do instead?** Without window nets, do children
   and cats just fly out of windows? (Probably: window locks, building codes, fewer
   high-rise apartments.) Without electric showers, how is water heated? This is the
   question readers actually ask. Research it explicitly.

### Por quê?
Why did Brazil go its own way, or, for low-scoring items, why is Brazil perfectly
ordinary here after all? Present it as a small investigation:

- List the plausible **hypotheses** (history, law, climate, economics, safety,
  technology, culture).
- For each: the evidence **for** and **against**, from `research.md`, and a verdict:
  *sustentada / parcialmente sustentada / inconclusiva / não sustentada*
  (*supported / partly supported / inconclusive / not supported*).
- It is fine, even expected, to end without a conclusive answer. Say so plainly.
- Never present a hypothesis as fact. Name who proposed it when it is someone's.

One `###` per hypothesis works well for three or more.

### Choque cultural (optional)
Only real anecdotes with a source: reports, interviews, articles, forum threads
(source type `other`, which lowers the evidence grade, and that is fine). Never
invent or "reconstruct" an anecdote. Omit the section rather than pad it.

### Veredito
Two to four sentences. Restate the score in plain words and close with the sharpest
line of the text. No new facts here.

## 4. Citations

- Cite with Pandoc syntax: `[@source-id]`, `[@a; @b]`, `[@a, p. 41]`.
- Every paragraph that states facts has at least one citation.
- Numbers always carry a citation right after them.
- Link other items with `[texto](jabuticaba:item-id)`, not with URLs.
- No bare external links: sources go in `item.json` and are cited.

## 5. Languages

- **pt-BR is the original.** Natural Brazilian Portuguese; avoid unnecessary
  anglicisms.
- **English is an adaptation, not a translation.** Explain Brazilian context a
  foreign reader lacks (what a *precatório* is, what CPF means). Rewrite jokes that do
  not survive translation. Keep the facts, numbers and citations identical.
- `title` and `summary` limits (32 and 120 characters) apply to both.

## 6. research.md

English. Follows `docs/templates/research.md`, which mirrors the prose sections, so
research collects exactly what the text needs. Each claim is one bullet:

```markdown
- About XX% of households heat water with an electric shower. [@some-survey-2022]
  > "XX,X% dos domicílios utilizavam chuveiro elétrico…"
```

(Placeholder values: the format is the point, not the number.)

- The quote is the passage that supports the claim, in its original language, short
  (a sentence or two). It lets a reviewer check the claim in seconds without opening
  the source, and it catches the most common research error: a real source cited for
  something it does not say.
- Mark uncertain claims with *(uncertain)* and explain why.
- Record **dead ends** (searched, not found) so nobody repeats them, and **open
  questions** for the human reviewer.

## 7. Checklist before asking for review

- [ ] Definition approved before research started.
- [ ] `research.md` complete; every claim has a source and a quote.
- [ ] Every factual sentence in `pt.md`/`en.md` is in `research.md`.
- [ ] All required sections present, in order; lengths roughly within range.
- [ ] "Lá fora" says what other countries do instead.
- [ ] "Por quê?" lists hypotheses with evidence and a verdict each.
- [ ] No invented anecdote, number or quote. Jokes are clearly jokes.
- [ ] At most one sharp line every other paragraph.
- [ ] `pnpm verify` passes.
