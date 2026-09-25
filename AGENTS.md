# AGENTS.md

Instructions for AI coding agents working on this repository. Read this whole file
before making changes.

## What this project is

The **Jabuticaba Index** (pt-BR: *Índice Jabuticaba®*) is a static website that
ranks "jabuticabas": things that exist only, or mostly, in Brazil. It presents
itself as a serious data-science institute, in deadpan style. The humor depends on
the data being **true, sourced and reproducible**, so correctness of content and
scoring matters as much as correctness of code.

Design documents (read the relevant one before touching that area):

- `docs/design/01-index-methodology-v0.md`: criteria, formula, uncertainty, evidence grade
- `docs/design/02-content-schema.md`: file layout, schema, validation rules (J001…)

## Golden rules

1. **Never commit, push, or create branches unless the user explicitly asks you to.**
   Leave changes in the working tree for the user to review. "Fix X" or "implement Y"
   is not permission to commit.
2. **Run `pnpm verify` before saying you are done.** It must pass. If it fails, fix
   it or report exactly what fails. Never claim success without running it.
3. **English for every identifier**: code, file names, schema keys, comments, tests,
   commit messages. Portuguese appears only in user-facing content (`pt.md` files,
   the `pt` entries of `src/i18n/ui.ts`).
4. **Do not add dependencies** without asking the user first.
5. **Never store computed values** (score, exclusivity, placeCount, evidence grade)
   in content files. They are always computed by the scoring code.
6. **Never invent facts in non-mock content.** Every claim in a `draft` or
   `published` item needs a real source. If you cannot find one, say so; do not
   guess. Mock items (`status: "mock"`) must use only `https://example.org/` URLs.
7. **Keep changes small and focused.** Do not refactor or reformat unrelated code.

## Commands

| Command              | What it does                                                        |
|----------------------|---------------------------------------------------------------------|
| `pnpm dev`           | Dev server at http://localhost:4321                                 |
| `pnpm verify`        | **The gate.** Lint, type check, tests, content validation, generated-file checks, build |
| `pnpm fix`           | Auto-format and apply safe lint fixes (Biome)                       |
| `pnpm lint`          | Lint and format check only                                          |
| `pnpm check`         | Type check (`astro check`, includes `.astro` files)                 |
| `pnpm test`          | Unit tests (Vitest)                                                 |
| `pnpm validate`      | Validate all content (rules J001…, see the schema doc)              |
| `pnpm index`         | Compute the index; rewrites `data/index-results.csv`                |
| `pnpm schema`        | Regenerate `schemas/item.schema.json` from the Zod schema           |
| `pnpm geo`           | Regenerate `data/geo/world.geo.json` from Natural Earth (`world-atlas`) |
| `pnpm build`         | **Production** build: fails if any mock item exists (J060)          |
| `pnpm build:preview` | Build that allows mock and draft items                              |

Run `pnpm fix` before `pnpm verify` to clear formatting errors automatically.

**After changing content or scoring code, run `pnpm index`.** After changing
`src/schema/`, run `pnpm schema`. After changing `src/geo/build-world.ts`, run
`pnpm geo`. All outputs are committed, and `pnpm verify` fails when they are stale.
Never edit `data/` or `schemas/` by hand.

## Versions and known traps

Your training data likely contains older versions of these tools. Follow these notes
over your memory.

| Tool        | Version | Traps |
|-------------|---------|-------|
| Node        | ≥ 24    | Runs `.ts` files directly (type stripping). Use only erasable TS syntax: **no `enum`, no `namespace`, no parameter properties**. Use `as const` objects and union types instead. |
| pnpm        | 12      | Build scripts need approval in `pnpm-workspace.yaml` (`allowBuilds`). |
| Astro       | 7       | Content collections are defined in `src/content.config.ts` (not `src/content/config.ts`), with loaders (`glob()` from `astro/loaders`). No `output: "hybrid"`. Built on **Vite 8**. The **Rust compiler** is the default: unclosed tags and invalid HTML nesting are errors, not auto-corrected. Default whitespace handling is `compressHTML: "jsx"` (spaces between inline elements are stripped, as in React; use `{" "}` when a space is needed). **Markdown is processed by Sätteri, not remark/rehype**: remark/rehype plugins don't run unless explicitly configured. `src/fetch.ts` is a reserved file name. |
| Tailwind    | 4       | **There is no `tailwind.config.js`.** Configuration is CSS-first: design tokens live in `@theme` in `src/styles/global.css`. Loaded via `@tailwindcss/vite`. |
| Zod         | 4       | Zod 4 API (e.g. `z.email()`, `z.iso.date()`; error customization via `error`, not `message`/`errorMap`). The shared schemas import from `zod`, not `astro/zod`, so they run outside Astro. |
| TypeScript  | 6       | Strictest config, plus `noUncheckedIndexedAccess`: indexing an array or record returns `T \| undefined`. Handle it; do not silence it with `!`. |
| Biome       | 2       | Replaces ESLint and Prettier. Do not add ESLint or Prettier configs. |
| Vitest      | 5       | Config in `vitest.config.ts`; only `*.test.ts` files under `src/` and `scripts/` are run. |

## Conventions

- **Imports:** relative, with explicit `.ts` extensions (`import { t } from "../i18n/ui.ts"`).
  Use `import type` for type-only imports.
- **No `any`, no `!` non-null assertions, no `@ts-ignore`.** Biome and TypeScript
  reject them.
- **Styling:** only Tailwind utilities based on the tokens in `global.css`
  (`bg-surface`, `text-ink`, `text-brand-green`…). **No arbitrary values** like
  `text-[#123456]` or `mt-[13px]`. Need a new color or size? Add a token to `@theme`.
- **Typography:** `font-serif` (Source Serif 4) for titles and article prose;
  `font-sans` (IBM Plex Sans, the default) for interface text and big numbers;
  `font-mono` (IBM Plex Mono) for data labels, codes, small numbers and eyebrows.
  Big standalone numbers use proportional digits; `tabular-nums` only where numbers
  line up in a column.
- **No client-side JavaScript** unless the task explicitly needs interactivity.
  Prefer CSS-only interactions (see the projection toggle in `WorldMap.astro`).
- **Themes:** `<html data-theme="light|dark">` is set before first paint (BaseLayout.astro).
  Colors switch automatically through the tokens in `global.css`; to vary something
  other than color per theme, use the `dark:` variant (it follows `data-theme`). Never
  use `@media (prefers-color-scheme)` in components.
- **i18n:** every user-facing string goes through `src/i18n/ui.ts` (UI labels) or the
  item's locale files (content). Never hard-code Portuguese or English text in
  components. `pt` is the reference locale; every locale must have the same keys.
- **Pure logic in `.ts` modules, presentation in `.astro` components.** Logic in
  `.ts` files must have tests.
- **Tests live next to the code they test**, in the same folder, with the same name
  plus `.test`: `src/scoring/formula.ts` is tested by `src/scoring/formula.test.ts`.
  Do not create a separate `tests/` folder.
- **One component per file.** Reuse existing components before creating new ones.

## Project layout

```
content/
  jabuticabas/<id>/   # one folder per item: item.json, pt.md, en.md
  reference/          # places.json (ISO codes), subdivisions/<country>.json
data/                 # GENERATED: index-results.csv, geo/world.geo.json (committed)
schemas/              # GENERATED: item.schema.json (committed)
docs/design/          # design documents; the source of truth for decisions
scripts/              # command-line entry points (validate, index, schema, geo); thin wrappers
src/
  schema/             # Zod schemas: the single source of truth for content shape
  scoring/            # the index: constants.ts (every tunable number), formula.ts, evidence.ts
  validation/         # cross-file rules J0xx (rules.ts)
  content-files/      # reading content/ and data/geo/ from disk; Markdown helpers
  geo/                # map geometry: building world.geo.json, projecting it to SVG paths
  site/               # page data: pure builders (ranking.ts, item-detail.ts, citations.ts)
                      #   + Astro collection access (content.ts)
  testing/            # builders for test data (makeItem, …); used only by tests
  content.config.ts   # Astro collections, using the same Zod schemas
  components/ layouts/ pages/ styles/ i18n/
```

- To change a weight or threshold of the index, edit only `src/scoring/constants.ts`.
- `src/schema/`, `src/scoring/`, `src/validation/` and `src/geo/` must never import
  from Astro: they also run in plain Node.
- A new validation rule gets a new code (never reuse one), an entry in the rule
  table of `docs/design/02-content-schema.md`, and a test in `rules.test.ts`.

## When you are unsure

Ask the user. Do not guess about facts, methodology, or design decisions. If a
design doc and the code disagree, point it out instead of silently picking one.
