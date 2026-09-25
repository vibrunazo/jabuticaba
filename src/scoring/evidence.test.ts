import { describe, expect, it } from "vitest";
import { makeItem, makePresence, makeSource } from "../testing/make-item.ts";
import { computeEvidenceGrade, isHiddenJabuticaba } from "./evidence.ts";
import { computeItemScore } from "./formula.ts";

describe("computeEvidenceGrade", () => {
  it("is A when every input cites a strong source", () => {
    expect(computeEvidenceGrade(makeItem())).toBe("A");
  });

  it("uses the strongest source of each input", () => {
    const item = makeItem({
      sources: [
        makeSource({ id: "blog", type: "other" }),
        makeSource({ id: "stats", type: "dataset" }),
      ],
      presence: [makePresence("PY", "widespread", ["blog", "stats"])],
      intensity: { value: 2, sources: ["stats"] },
    });
    expect(computeEvidenceGrade(item)).toBe("A");
  });

  it("counts editorial inputs as zero", () => {
    const item = makeItem({ intensity: { value: 2, sources: [], editorial: true } });
    // Inputs: presence (3) + intensity (0) → mean 1.5 → C.
    expect(computeEvidenceGrade(item)).toBe("C");
  });

  it("is D when nothing is sourced", () => {
    const item = makeItem({
      presence: [makePresence("PY", "widespread", [])],
      intensity: { value: 2, sources: [], editorial: true },
    });
    expect(computeEvidenceGrade(item)).toBe("D");
  });

  it("never changes the score", () => {
    const strong = makeItem();
    const weak = makeItem({ sources: [makeSource({ type: "other" })] });
    expect(computeEvidenceGrade(strong)).not.toBe(computeEvidenceGrade(weak));
    expect(computeItemScore(strong)).toEqual(computeItemScore(weak));
  });
});

describe("isHiddenJabuticaba", () => {
  it("is true only when the whole awareness range is at most 1", () => {
    expect(isHiddenJabuticaba(makeItem({ awareness: { value: 0, sources: [] } }))).toBe(true);
    expect(
      isHiddenJabuticaba(makeItem({ awareness: { value: { min: 0, max: 1 }, sources: [] } })),
    ).toBe(true);
    expect(
      isHiddenJabuticaba(makeItem({ awareness: { value: { min: 1, max: 2 }, sources: [] } })),
    ).toBe(false);
  });

  it("never changes the score", () => {
    const hidden = makeItem({ awareness: { value: 0, sources: [] } });
    const famous = makeItem({ awareness: { value: 4, sources: [] } });
    expect(computeItemScore(hidden)).toEqual(computeItemScore(famous));
  });
});
