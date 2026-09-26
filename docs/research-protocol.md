# Research protocol

How a human and an AI agent research one item together, from idea to published
page. Writing rules are in `docs/editorial-guide.md`; this document is about the
process and who does what.

## Roles

| | Human (editor) | Agent (researcher) |
|---|---|---|
| Brings | Local knowledge, judgment, Portuguese and paywalled sources, the final say | Systematic search across many countries, reading, extracting, filling files, validating |
| Decides | The definition, disputed ratings, when to publish | Nothing final: it proposes, cites and flags |
| Never | Merges without skimming the research log | Invents a fact, quote, number or anecdote; commits or posts to GitHub unless asked |

## The steps

### 1. Brief: the human opens an issue

Use the **"Pesquisa de jabuticaba"** issue template on GitHub. It asks for:
- the item, in plain words (existing item id, or a new one);
- why you think it is a jabuticaba;
- **leads**: links you already have, countries you suspect, people or institutions
  who would know. Links are leads, not facts: the agent still has to read them;
- questions you are curious about.

You can add leads to the issue at any time, during research too.

### 2. Branch and start

On a new branch named `research/<item-id>`:

```bash
pnpm research:start <item-id>                      # existing mock item
pnpm research:start <item-id> --category <cat>     # new item
```

For a **mock item**, this converts it to `status: "draft"` and deletes all of its
fictional data (sources, presence, ratings, article text), keeping only the title,
slug, summary, category and placeholder image, to be revised. For a **new item**, it
creates the folder from `docs/templates/`. In both cases it adds `research.md`.

From here on, `pnpm validate` lists what is still missing for the draft (as
warnings). That list is the to-do list.

### 3. Scoping: the agent proposes, the human approves

Before researching anything, the agent proposes, in the issue (or in chat):
- **the definition**: the exact scope that gets scored, and what is left out;
- **the research plan**: which countries to check first, what data would settle
  intensity, what "what do they do instead?" questions to answer;
- **candidate hypotheses** for "Por quê?", to be tested, not concluded.

**The human approves or edits the definition.** It is the most consequential
decision of the item: hours of research depend on it.

### 4. Research: the agent fills research.md

- Every fact goes into `research.md` first: claim, citation, supporting quote
  (template format). Human leads are read first.
- Sources go into `item.json` (`sources`), with the right `type`.
- **Archiving:** the agent checks whether a web.archive.org snapshot already exists
  (read-only) and fills `archiveUrl`. It lists sources without a snapshot; the human
  saves them, or explicitly allows the agent to submit them.
- Presence per country and the ratings go into `item.json`, as ranges where the
  evidence is uncertain, with `editorial: true` where they are judgment.
- Dead ends and open questions are written down, not dropped.

The agent then reports: main findings, surprises, open questions, and what it could
not access (paywalls, PDFs, sites that block automated access). The human answers
and adds leads; repeat until the open questions are settled.

### 5. Writing: pt.md, then en.md

Written only from `research.md` and `item.json`, following
`docs/editorial-guide.md`. Also revise `title`, `summary` and the image (a real,
reusable one with its credit, or keep the placeholder for now).

### 6. Pull request

When asked, the agent commits on the branch and opens a pull request using the
research-log template (`.github/pull_request_template.md`): claims that drive the
score, editorial judgments, open questions, sources without snapshots. CI runs
`pnpm verify`; Netlify builds a preview of the page.

### 7. Review

The human spot-checks the claims that move the score most (the quotes make this
fast), reads the text on the preview, and comments. The agent fixes. Repeat.

### 8. Publish

The human decides: `status: "published"`, `lastReviewed` set to the day, merge.
The merge is the publication; git keeps the whole trail.

## Updating a published item

Same steps from 3 (without `research:start`): new facts go into `research.md` first,
then `item.json` and the text. Update `lastReviewed`.
