# Jabuticaba Index — Methodology v0.2 (draft)

Status: **draft for discussion**. This document defines the index: criteria,
scales, formula, uncertainty and evidence grading. Constants are placeholders to be
calibrated once real data exists. All numbers in the worked examples are
**illustrative guesses, not researched facts**.

The file format that stores these inputs is specified in
[02-content-schema.md](02-content-schema.md).

Naming convention: every identifier (criteria, fields, constants) is English.
Portuguese appears only in the display names shown on the site (section 11).

## 1. Goals

1. **Reproducible:** anyone can clone the repo, run `pnpm index`, and get the exact
   same scores. No network, no model and no randomness at calculation time.
2. **Auditable:** every score decomposes into a few inputs. Each input has a written
   justification and sources, so a reader can dispute a specific input rather than
   the whole score.
3. **Honest about uncertainty:** inputs can be ranges, and the score is published
   with its range and an evidence grade.
4. **Simple:** two scored criteria, one short formula, all constants in one file.
   Each criterion measures exactly one thing.

## 2. What the index measures

> How rare outside Brazil is this thing?

- **0%** — common worldwide, and neither more common nor more intense in Brazil.
- **100%** — exclusively Brazilian; found abroad only when exported from Brazil.

The 0% definition matters for the formula. Something common worldwide but far
*more common* in Brazil is **not** 0%. Intensity can lift a non-exclusive item,
but only partially (see `MAX_INTENSITY_CREDIT`).

The index is **descriptive**. It measures rarity, not quality, harm or importance.
Social critique comes from the facts and the prose, never from the formula.

### Unit of analysis

Every item must have a precise `definition`, because the score depends on scope.
"Voting machines" scores low. "DRE voting machines without a voter-verified paper
trail, used nationwide in general elections" scores high. The definition is what
gets scored, not the title.

The definition is also where **distinctiveness** is handled. If Brazil's version is
qualitatively different from foreign analogues, the definition must say what makes
it different. Foreign analogues that lack that feature are then recorded as
`absent` or `marginal`, and `exclusivity` captures the difference.

### Time

Scores describe the **present** (as of the item's `lastReviewed` date). Historical
presence does not count unless the definition says so.

## 3. Scored criteria

There are two scored criteria. `exclusivity` is *computed* from place data.
`intensity` is *rated* on an anchored 0–4 scale.

### 3.1 `exclusivity` (computed, 0–1)

Derived from the item's list of places where it exists (the same data that draws
the world map). Each entry is an **ISO 3166-1 alpha-2 code**, so territories with
their own code (e.g. French Guiana `GF`) are separate entries from their sovereign
state (`FR`). Each entry gets a presence level:

| Level        | Weight | Meaning                                                              |
|--------------|--------|----------------------------------------------------------------------|
| `widespread` | 1.0    | Common at national scale                                             |
| `regional`   | 0.5    | Present in part of the place, or in a significant niche              |
| `marginal`   | 0.1    | Exists, but rare and hard to find                                    |
| `absent`     | 0.0    | Checked and confirmed absent                                         |
| *(unlisted)* | 0.0    | Not researched; treated as absent                                    |

`absent` and unlisted weigh the same, but they are not the same claim. `absent`
means "we checked, and here is the source". The map draws them differently:
checked-absent vs. no data.

#### Brazilian exports

An entry can be flagged `exported`: the thing exists there **only because Brazil
exported it** (products, restaurants, the diaspora). Its weight is multiplied by
`EXPORT_WEIGHT_FACTOR` (0.5).

Exports count because of what the index is for: pointing out things Brazilians
take for granted that they would miss abroad. An exported jabuticaba is still
Brazilian, but a Brazilian traveler no longer misses it, so it is less of a
jabuticaba. The analogy: in an "apple pie index" of Americanness, McDonald's
would score low. It is American, but exported everywhere, so no American abroad
ever misses it. Guaraná soda, found abroad only on the shelves of Brazilian
grocery stores (`marginal`, exported), barely moves. Açaí bowls, sold in cafés
across half the world (`regional` or `widespread`, exported), drop a lot.

The level still describes how common it is there, so an export can be
`widespread` (açaí bowls in the US) or `marginal` (guaraná in Japan).

Brazil (`BR`) is never listed.

**Effective place count:**
`placeCount = Σ PRESENCE_WEIGHTS[level] × (exported ? EXPORT_WEIGHT_FACTOR : 1)`

**Exclusivity, on a log scale:**

```
exclusivity = clamp(1 − ln(1 + placeCount) / ln(1 + SATURATION_PLACE_COUNT), 0, 1)
```

- `placeCount = 0` gives `1`. `placeCount ≥ 100` gives `0`.
- Log scale because the difference between 0 and 3 other places matters far more
  than the difference between 60 and 63. The first foreign place alone cuts
  exclusivity by 15%.

#### Territories and sovereign states

Data and counting use ISO entries, so French Guiana is its own entry: its own map
color, and it counts once. A reference lookup (`GF → FR`, `GP → FR`, `PR → US`, …)
lets the page *also* list sovereign states. Capybara presence in `GF` is shown as
"France (French Guiana)" in the list of countries. That makes the prose line
"…common in neighboring countries such as Bolivia and France" literally true,
backed by the data. France shares a land border with Brazil, which is the joke.

### 3.2 `intensity` (rated 0–4)

**Prevalence only:** how much more common or entrenched it is in Brazil than in the
most comparable other place where it exists. Duration counts as entrenchment; there
is no separate persistence score. Qualitative difference is *not* intensity; it
belongs in the `definition` (section 2).

When data exists, record the quantitative `ratio`: prevalence in Brazil (per capita
or per household, whichever the definition calls for) ÷ the same measure in the
highest other place. The level must then match the ratio's band. The validator
warns on a mismatch.

| Level | Qualitative anchor                                              | `ratio` band |
|-------|-----------------------------------------------------------------|--------------|
| 0     | No more common in Brazil than elsewhere                         | ≤ 1×         |
| 1     | Somewhat more common in Brazil                                  | 1–2×         |
| 2     | Clearly more common                                             | 2–5×         |
| 3     | Far more common; Brazil is the leading case by a wide margin    | 5–20×        |
| 4     | Overwhelmingly more common; elsewhere only traces               | > 20×        |

Consistency check: "elsewhere only traces" contradicts being `widespread` in many
places. The validator warns on `intensity = 4` with `placeCount > 20`.

## 4. Formula

```
e = exclusivity               (0–1, computed)
i = intensity / 4

rarity = e + MAX_INTENSITY_CREDIT · i · (1 − e)
score  = round(100 · rarity)
```

### Constants (v0)

| Constant                 | Value | Meaning                                                                 |
|--------------------------|-------|-------------------------------------------------------------------------|
| `SATURATION_PLACE_COUNT` | 100   | Places at which an item is "fully common" (`exclusivity = 0`)           |
| `PRESENCE_WEIGHTS`       | 1.0 / 0.5 / 0.1 / 0 | `widespread` / `regional` / `marginal` / `absent` |
| `EXPORT_WEIGHT_FACTOR`   | 0.5   | Multiplier for presence that exists only as a Brazilian export |
| `MAX_INTENSITY_CREDIT`   | 0.5   | Highest rarity a completely non-exclusive item can reach through intensity alone |

Interpretation:

- **Exclusivity dominates.** If nothing like it exists elsewhere (`e = 1`), rarity
  is 1 whatever the intensity.
- **Intensity fills part of the gap.** At `e = 0`, `rarity = MAX_INTENSITY_CREDIT · i`,
  so the constant is literally "the maximum score of a ubiquitous item". At 0.5,
  something that exists everywhere but is far more common in Brazil is at most
  "half jabuticaba". Given the consistency check in 3.2, the realistic ceiling for
  a ubiquitous item is `intensity = 3`, which gives 38%.

### Code requirement

All constants live in **one file** (e.g. `src/scoring/constants.ts`), each with a
comment that points to this section. The formula lives in one pure-function module
(`src/scoring/formula.ts`) with no I/O. Changing a constant must be a one-line
edit, followed by `pnpm index` to regenerate the results.

(Avoid naming the module `index`, which clashes with `index.ts` files. "Scoring"
is the code name for the Jabuticaba Index.)

### Rejected alternative: a hard exclusivity gate

A review proposed gating intensity by exclusivity (e.g. `e + K·i·√e·(1 − e)`), so
that `e = 0` always gives 0. That was rejected because it contradicts the 0%
definition in section 2: "common worldwide **and** neither more common nor more
intense". The legitimate concern (a ceiling of 80% for ubiquitous items was too
generous) is addressed by lowering `MAX_INTENSITY_CREDIT` from 0.8 to 0.5.

## 5. Uncertainty

Any input may be a range instead of a single value:

- a presence level: `["marginal", "regional"]` (low, high)
- a rating: `{ "min": 1, "max": 2 }`

The formula is **monotone** in every input: the score rises as `placeCount` falls
and as intensity rises. So the exact bounds come from two evaluations:

- **low** = f(max placeCount, min intensity)
- **high** = f(min placeCount, max intensity)
- **point estimate** = f(midpoint of every range)

This is a **plausibility range** (worst case to best case), *not* a statistical
confidence interval, and the methodology page says so explicitly. It is exact and
needs no random seed.

### Display

- **Cards:** the point estimate plus a small scientific-paper-style error bar
  (horizontal line with end caps) spanning low–high on the score scale. Accessible
  label: "62%, range 56 to 69".
- **Detail page:** the range written out, plus the breakdown of every input and its
  own range.

## 6. Evidence grade (computed, not scored)

Each item gets a grade from **A** to **D**, shown next to its score, saying how
solid the evidence behind the inputs is. It is computed from source types, never
rated by hand, and it never changes the score. Uncertainty is already expressed by
the ranges.

**Source strength**, by source `type`:

| Strength | Source types                                                           |
|----------|------------------------------------------------------------------------|
| 3        | `dataset` (official statistics), `government` (laws, official documents), `academic` (peer-reviewed) |
| 2        | `organization` (NGO, industry or international-body reports), `reference` (encyclopedias, books), `news` |
| 1        | `other` (blogs, forums, social media)                                  |
| 0        | No source, or the input is marked `editorial`                          |

**Input strength** = the strongest source cited by that input. The inputs are every
`presence` entry plus `intensity`.

**Grade** = from the mean input strength:

| Grade | Mean strength |
|-------|---------------|
| A     | ≥ 2.5         |
| B     | ≥ 2.0         |
| C     | ≥ 1.0         |
| D     | < 1.0         |

The thresholds are constants in the same scoring constants file.

## 7. Descriptive attributes (not scored)

These are recorded and displayed but never enter the formula. The index measures
rarity, and none of these are rarity.

### 7.1 `awareness` (rated 0–4)

How aware Brazilians who know the thing are that it is uncommon abroad.

| Level | Anchor                                                                  |
|-------|-------------------------------------------------------------------------|
| 0     | Treated as universal; its uniqueness is essentially never mentioned     |
| 1     | Uniqueness occasionally mentioned, but not part of public perception    |
| 2     | Some public awareness; its uniqueness is sometimes part of the debate   |
| 3     | Commonly acknowledged as Brazilian                                      |
| 4     | A national symbol *because* it is Brazilian                             |

Items whose `awareness` range reaches no higher than 1 **and** whose score is above
50% get the "hidden jabuticaba" badge. The score condition keeps the badge off
things that are barely jabuticabas at all. The jabuticaba fruit, the capybara and the vira-lata caramelo sit at 3–4;
the obscure institutional items tend to sit at 0.

### 7.2 `since`

The year it started to exist in Brazil (or a year range, when uncertain).

### 7.3 `category`

One category from a fixed list (see the schema doc).

### Why an earlier `banality` criterion was dropped

Methodology draft 0.0 scored `banality` ("how ordinary it is to Brazilians"). It was
removed because it conflated two unrelated things:

- **Familiarity**, meaning how many Brazilians encounter it. What makes this
  relevant to rarity is already captured by `intensity`. And being obscure does not
  make something less rare: a rule of Congress that almost nobody knows about can
  still exist nowhere else.
- **Awareness of uniqueness.** This is a fact about perception, not about the world,
  so it moved to the non-scored `awareness` attribute.

For the same reason, `intensity` level 4 originally mixed prevalence with
"qualitatively different". Distinctiveness moved to the `definition` (section 2).

## 8. Worked examples (illustrative inputs only)

| Item                                | placeCount | intensity | Score            |
|-------------------------------------|------------|-----------|------------------|
| Refrigerator (0% anchor)            | 150        | 0         | **0%**           |
| Ubiquitous, far more common in Brazil | 150      | 3         | **38%**          |
| Vira-lata caramelo                  | 40–80      | 1–2       | **28% (17–40)**  |
| Capybara                            | 10–12      | 1–2       | **56% (51–61)**  |
| Electric shower                     | 8–15       | 3         | **66% (62–70)**  |
| Paperless DRE voting machines       | 0.5–1.5    | 4         | **92% (90–96)**  |

The vira-lata caramelo result (free-roaming tan mongrels exist wherever
free-roaming dogs do) is an example of the index contradicting intuition. That is a
feature, and it's the site's best material.

The inputs for the voting machines (e.g. whether Bhutan still has no VVPAT, and
whether Louisiana counts as `regional` for the US) are exactly the facts that must
be researched and sourced before publication.

## 9. Map geometry

- **Source:** Natural Earth (public domain), through the `world-atlas` npm package.
  Its "countries" layer bundles some territories into their sovereign state
  (French Guiana inside France, Svalbard inside Norway, the Caribbean Netherlands
  inside the Netherlands) and leaves a few disputed areas without a code.
- **`pnpm geo`** (`scripts/build-geo.ts`, logic in `src/geo/build-world.ts`):
  - splits those overseas parts out by the position of each polygon
    (`PART_SPLITS`);
  - codes Kosovo as `XK`, and draws Northern Cyprus and Somaliland as part of
    Cyprus and Somalia, following ISO 3166-1 (`UNCODED_FEATURES`);
  - takes shapes from the 1:110m data (small and fast to draw) and turns places
    that only exist at 1:50m (Singapore, Cabo Verde, Caribbean islands…) into
    **points**, so they can still be marked;
  - re-keys everything by ISO alpha-2 and writes `data/geo/world.geo.json`
    (GeoJSON, one feature per line), which is committed. `pnpm verify` fails if it
    is stale (J072).
- The site renders SVG from that file at build time (`src/geo/world-map.ts`),
  rounding coordinates to whole units of the viewBox to keep pages small. The map
  component never does code translation.
- **Colors:** an ordinal green ramp for `marginal` → `regional` → `widespread`
  (one hue, monotone lightness, validated for both themes), yellow for
  a matching amber ramp for Brazilian exports, cool grey for `absent` (checked), a
  faint neutral for no data, and jabuticaba purple for Brazil. Uncertain places take the color of the highest
  possible level; the presence table below the map shows the full range.
- Every map has a legend, per-country tooltips (SVG `<title>`) and a table view.
- Two projections, both Equal Earth: `standard` ("Colonial": centred on
  Greenwich, north up) and `brazil-centered` ("Sovereign": centred on 50° W,
  rotated 180°, south up, following IBGE). `brazil-centered` is the default in
  every locale. A CSS-only toggle switches between them.
- **Subdivision maps (planned):** items with `subdivisions` data currently show a
  table. Maps per country (Brazilian states, US states…) need admin-1 geometry
  added to `pnpm geo`; until then rule J027 is not enforced. Subdivisions are
  descriptive and **not scored**: the country-level presence entry is what counts.

## 10. Calibration tests

Anchor fixtures used as unit tests of the formula (not site content):

- A globally common item (refrigerator) scores **0**.
- A hypothetical item with `placeCount = 0` scores **100**, whatever its intensity.
- An item with `placeCount ≥ 100` never scores above `100 · MAX_INTENSITY_CREDIT`.
- Changing any non-scored attribute (`awareness`, `since`, `category`) or any
  source's type never changes the score.
- Monotonicity: increasing intensity never lowers the score; adding a place or
  raising its level never raises it.
- `low ≤ point ≤ high` for every item.

## 11. Display names (pt-BR / en)

| Identifier                   | pt-BR                   | en                   |
|------------------------------|-------------------------|----------------------|
| Jabuticaba Index             | Índice Jabuticaba®      | Jabuticaba Index®    |
| `exclusivity`                | Exclusividade           | Exclusivity          |
| `intensity`                  | Intensidade             | Intensity            |
| `rarity`                     | Coeficiente de Raridade | Rarity Coefficient   |
| `awareness`                  | Consciência             | Awareness            |
| "hidden jabuticaba" badge    | Jabuticaba oculta       | Hidden jabuticaba    |
| evidence grade               | Grau de evidência       | Evidence grade       |
| `standard` projection        | Projeção Colonial       | Colonial Projection  |
| `brazil-centered` projection | Projeção Soberana       | Sovereign Projection |

## 12. Planned for v1

- **Population-weighted exclusivity.** v0 counts places equally, so Nauru weighs the
  same as India. v1 will weigh each place by its share of world population, from a
  committed World Bank snapshot, or blend that with the plain count. Territories
  are handled naturally: French Guiana contributes French Guiana's population, not
  France's. This needs a `population` field in the places reference file (see the
  schema doc).
- **Possibly: derive a country's level from its subdivisions** (e.g. by the share of
  population covered), instead of rating it by hand. Only once enough subdivision
  data exists.

## 13. Decisions log

- Two scored criteria (`exclusivity`, `intensity`); simplicity is deliberate.
- `MAX_INTENSITY_CREDIT = 0.5` for v0; rebalance once real data exists.
- Hard exclusivity gate rejected (section 4).
- `banality` dropped from the score; `awareness` recorded as non-scored (section 7).
- `intensity` is prevalence only; distinctiveness goes in the `definition`.
- Evidence grade is computed from source types, not rated by hand.
- `absent` added as a presence level, distinct from unlisted.
- `brazil-centered` is the default projection in every locale.
- "Hidden jabuticaba" badge requires a score above 50% (section 7.1).
- Subnational data uses ISO 3166-2 for any country, not just Brazil; it is not scored.
- **v0.2:** Brazilian exports count at half weight (`EXPORT_WEIGHT_FACTOR`). The
  `imported` level (weight 0) is replaced by an `exported` flag on any level, so a
  widely exported thing (açaí bowls) loses more than a barely exported one
  (guaraná soda). See section 3.1.
