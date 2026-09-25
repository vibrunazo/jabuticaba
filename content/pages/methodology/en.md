---
translationStatus: "reviewed"
title: "How we measure how Brazilian something is"
summary: "The complete methodology of the Jabuticaba Index®: criteria, formula, uncertainty and sources. Reproducible by anyone with a computer and some patience."
updated: "2026-09-25"
---

## What the index measures

The Jabuticaba Index® answers a single question: **how rare, outside Brazil, is something Brazilians consider normal?**

- **0%**: common worldwide, and neither more common nor more intense in Brazil.
- **100%**: exclusively Brazilian; abroad, it only exists if taken from here.

The index is **descriptive**. It measures rarity, not quality, importance or harm. When a jabuticaba is also a problem, that shows in the facts and the text, never in the formula.

## Unit of analysis

Each item has a precise **definition**, and the definition is what gets scored, not the title. "Electronic voting machines" are common; "direct-recording electronic voting machines, without a voter-verified paper record, used nationwide in general elections" are something else, and much rarer.

When Brazil's version of something is qualitatively different from foreign versions, the definition says what makes it different. Foreign versions without that feature count as absent.

Scores describe the **present**, as of each item's last review.

## Exclusivity

Exclusivity comes from the list of places, outside Brazil, where the thing exists: the same list that draws each item's map. Each place is an ISO 3166-1 code, so territories with their own code, such as French Guiana, count separately from their sovereign states.

Each place gets a presence level, and each level a weight:

| Level | Weight | Meaning |
|---|---|---|
| Widespread | {{WEIGHT_WIDESPREAD}} | Common at national scale |
| Regional | {{WEIGHT_REGIONAL}} | Present in part of the place, or in a significant niche |
| Marginal | {{WEIGHT_MARGINAL}} | Exists, but rare and hard to find |
| Absent (checked) | {{WEIGHT_ABSENT}} | We checked, and it isn't there |
| No data | {{WEIGHT_ABSENT}} | Not researched yet; treated as absent |

"Absent" and "no data" weigh the same, but they are not the same claim. "Absent" means we checked and have the source; the maps show the difference.

### Brazilian exports

When something exists somewhere **only because Brazil exported it** (products, restaurants, the diaspora), that place's weight is multiplied by **{{EXPORT_WEIGHT_FACTOR}}**.

Exports count because the index exists to point out things a Brazilian would miss abroad. An exported jabuticaba is still Brazilian, but it is no longer missed. In a hypothetical "apple pie index" of Americanness, McDonald's would score low: it is American, but it is everywhere, and no American abroad ever misses it. Guaraná soda, found abroad only in Brazilian grocery stores, barely loses points. Açaí bowls, sold in cafés across half the world, lose many.

### From count to exclusivity

The sum of the weights is the **weighted place count**. Exclusivity runs from 1 (nowhere else) to 0 ({{SATURATION_PLACE_COUNT}} places or more), on a log scale:

```
exclusivity = 1 − ln(1 + places) ÷ ln(1 + {{SATURATION_PLACE_COUNT}})
```

The scale is logarithmic because the difference between zero and three other countries matters far more than the difference between sixty and sixty-three. The first foreign place alone lowers exclusivity by {{FIRST_PLACE_DROP_PERCENT}}%.

## Intensity

Intensity measures **how much more common the thing is in Brazil** than in the comparable place where it is most common. It is a rating from 0 to 4. When data exists, we compute the prevalence ratio (prevalence in Brazil ÷ prevalence in the foreign place where it is highest), and the rating follows that ratio's band:

| Rating | Meaning | Prevalence ratio |
|---|---|---|
| 0 | No more common in Brazil | up to {{RATIO_BAND_1}}× |
| 1 | Somewhat more common in Brazil | up to {{RATIO_BAND_2}}× |
| 2 | Clearly more common | up to {{RATIO_BAND_3}}× |
| 3 | Far more common; Brazil is the leading case by a wide margin | up to {{RATIO_BAND_4}}× |
| 4 | Overwhelmingly more common; elsewhere only traces | above {{RATIO_BAND_4}}× |

Differences in kind are not intensity: they go into the definition. A rating of 4 is also hard to justify for something present in many places, and validation warns when an item has intensity 4 and more than {{INTENSITY_4_MAX_PLACE_COUNT}} weighted places.

## The formula

```
rarity = E + {{MAX_INTENSITY_CREDIT}} × (I ÷ 4) × (1 − E)
index  = round(100 × rarity)
```

where **E** is exclusivity and **I** is intensity.

- **Exclusivity dominates.** If nothing similar exists anywhere else (E = 1), rarity is maximal, whatever the intensity.
- **Intensity fills part of the remaining gap.** Something found everywhere but far more common in Brazil is not 0%: it reaches at most {{UBIQUITOUS_MAX_SCORE}}%, and in practice {{UBIQUITOUS_SCORE_AT_3}}%. Being the biggest is not the same as being the only one.

Every item page shows this calculation with the item's own numbers, under "How we got this number".

## Uncertainty

Any input can be a range instead of a value: a place can have presence "between marginal and regional", and intensity can be "between 1 and 2". Since the formula only moves one way for each input, two calculations give the exact bounds:

- **low**: with the highest place count and the lowest intensity;
- **high**: with the lowest place count and the highest intensity;
- **central estimate**: with the midpoint of every range.

The result is published as **"62% (56–69%)"**. It is a **plausibility range**, from worst to best case. It is not a statistical confidence interval, and does not pretend to be.

## Evidence grade

Each item gets a grade from **A** to **D** that says how solid the sources behind its inputs are. The grade is computed from source types, never assigned by hand, and **does not change the index**.

| Strength | Source types |
|---|---|
| {{STRENGTH_STRONG}} | Official statistics, official documents, peer-reviewed research |
| {{STRENGTH_MEDIUM}} | Reports by organizations, reference works, news |
| {{STRENGTH_WEAK}} | Blogs, forums, social media |
| 0 | No source, or editorial judgment |

Each input is worth the strength of its best source. The grade comes from the average: **A** from {{GRADE_A}}, **B** from {{GRADE_B}}, **C** from {{GRADE_C}}, and **D** below that.

## What is not part of the score

**Awareness** (0 to 4) records how aware Brazilians are that the thing is rare abroad: from 0 ("treated as universal") to 4 ("a national symbol precisely because it is Brazilian"). It is not part of the formula, because rarity does not depend on what anyone believes.

Items with awareness of at most {{HIDDEN_MAX_AWARENESS}} and an index above {{HIDDEN_MIN_SCORE}}% get the **Hidden jabuticaba** badge: very Brazilian things almost nobody notices are Brazilian.

## Maps

Maps use Natural Earth data (public domain), with overseas territories separated from their sovereign states. Disputed areas follow ISO 3166-1: Crimea is shown as part of Ukraine, Taiwan separately from China, and Northern Cyprus and Somaliland as part of Cyprus and Somalia.

There are two projections, both Equal Earth:

- **Sovereign** (default): centered on 60° W, south up, as on IBGE's world maps. Its edges fall on 120° E, which cuts Russia in half and puts mainland China and Taiwan at opposite ends of the map.
- **Colonial**: the usual map, centered on Greenwich, north up.

## Reproducibility

All of the index's data, texts and code are in the [public domain (CC0)](https://github.com/vibrunazo/jabuticaba/blob/master/LICENSE), in the [project repository](https://github.com/vibrunazo/jabuticaba). Anyone can download it and recompute every score with a single command (`pnpm index`), which uses no network, no language models and no random numbers. The result is saved in [`data/index-results.csv`](https://github.com/vibrunazo/jabuticaba/blob/master/data/index-results.csv); every change to the data or the formula shows up there, line by line, in the repository history.

## Version history

- **v0.2**: Brazilian exports count at reduced weight ({{EXPORT_WEIGHT_FACTOR}}×) instead of zero.
- **v0.1**: first version. Two scored criteria (exclusivity and intensity); awareness recorded but not scored; evidence grade computed from source types.

The current version is **v{{METHODOLOGY_VERSION}}**.
