import { describe, expect, it } from "vitest";
import type { PresenceEntry } from "../schema/item.ts";
import { makePresence } from "../testing/make-item.ts";
import { EXPORT_WEIGHT_FACTOR, MAX_INTENSITY_CREDIT, SATURATION_PLACE_COUNT } from "./constants.ts";
import {
  computeItemScore,
  exclusivityFromPlaceCount,
  placeCountBounds,
  presenceWeight,
  ratingBounds,
  scoreFromInputs,
} from "./formula.ts";

/** `count` places, all at the same level. */
function presenceOf(count: number, level: PresenceEntry["level"]): PresenceEntry[] {
  return Array.from({ length: count }, (_, i) => makePresence(`P${i}`, level));
}

describe("exclusivityFromPlaceCount", () => {
  it("is 1 when no other place has it", () => {
    expect(exclusivityFromPlaceCount(0)).toBe(1);
  });

  it("is 0 at the saturation point and beyond", () => {
    expect(exclusivityFromPlaceCount(SATURATION_PLACE_COUNT)).toBe(0);
    expect(exclusivityFromPlaceCount(250)).toBe(0);
  });

  it("drops by about 15% for the first foreign place", () => {
    expect(exclusivityFromPlaceCount(1)).toBeCloseTo(0.85, 2);
  });
});

// Methodology section 10: calibration tests.
describe("calibration", () => {
  it("scores a globally common item (refrigerator) at 0", () => {
    expect(scoreFromInputs(150, 0)).toBe(0);
  });

  it("scores an item that exists nowhere else at 100, whatever its intensity", () => {
    for (const intensity of [0, 1, 2, 3, 4]) {
      expect(scoreFromInputs(0, intensity)).toBe(100);
    }
  });

  it("never scores a ubiquitous item above 100 × MAX_INTENSITY_CREDIT", () => {
    expect(scoreFromInputs(SATURATION_PLACE_COUNT, 4)).toBeLessThanOrEqual(
      100 * MAX_INTENSITY_CREDIT,
    );
  });

  it("never lowers the score when intensity rises", () => {
    for (const placeCount of [0, 1, 5, 20, 60, 150]) {
      for (let intensity = 0; intensity < 4; intensity++) {
        expect(scoreFromInputs(placeCount, intensity + 1)).toBeGreaterThanOrEqual(
          scoreFromInputs(placeCount, intensity),
        );
      }
    }
  });

  it("counts an exported place less than a local one, but more than nothing", () => {
    for (const level of ["marginal", "regional", "widespread"] as const) {
      expect(presenceWeight(level, true)).toBeLessThan(presenceWeight(level, false));
      expect(presenceWeight(level, true)).toBeGreaterThan(0);
    }
    expect(presenceWeight("absent", true)).toBe(0);
  });

  it("never raises the score when a place is added", () => {
    for (const intensity of [0, 2, 4]) {
      for (let placeCount = 0; placeCount < 120; placeCount++) {
        expect(scoreFromInputs(placeCount + 1, intensity)).toBeLessThanOrEqual(
          scoreFromInputs(placeCount, intensity),
        );
      }
    }
  });
});

// Methodology section 8: worked examples. If a constant changes, update the doc too.
describe("worked examples", () => {
  it.each([
    { item: "refrigerator", placeCount: [150, 150], intensity: [0, 0], expected: [0, 0, 0] },
    { item: "ubiquitous", placeCount: [150, 150], intensity: [3, 3], expected: [38, 38, 38] },
    { item: "caramel mutt", placeCount: [40, 80], intensity: [1, 2], expected: [17, 28, 40] },
    { item: "capybara", placeCount: [10, 12], intensity: [1, 2], expected: [51, 56, 61] },
    { item: "electric shower", placeCount: [8, 15], intensity: [3, 3], expected: [62, 66, 70] },
    { item: "paperless DRE", placeCount: [0.5, 1.5], intensity: [4, 4], expected: [90, 92, 96] },
  ])(
    "$item scores $expected.1 ($expected.0–$expected.2)",
    ({ placeCount, intensity, expected }) => {
      const [minCount = 0, maxCount = 0] = placeCount;
      const [minIntensity = 0, maxIntensity = 0] = intensity;
      const low = scoreFromInputs(maxCount, minIntensity);
      const point = scoreFromInputs((minCount + maxCount) / 2, (minIntensity + maxIntensity) / 2);
      const high = scoreFromInputs(minCount, maxIntensity);
      expect([low, point, high]).toEqual(expected);
    },
  );
});

describe("placeCountBounds", () => {
  it("weights levels and resolves ranges", () => {
    const presence = [
      makePresence("PY", "widespread"),
      makePresence("AR", "regional"),
      makePresence("US", ["absent", "marginal"]),
      { ...makePresence("PT", "widespread"), exported: true as const },
    ];
    const bounds = placeCountBounds(presence);
    // 1 + 0.5 + (0 to 0.1) + 1 × EXPORT_WEIGHT_FACTOR
    expect(bounds.low).toBeCloseTo(1.5 + EXPORT_WEIGHT_FACTOR);
    expect(bounds.point).toBeCloseTo(1.55 + EXPORT_WEIGHT_FACTOR);
    expect(bounds.high).toBeCloseTo(1.6 + EXPORT_WEIGHT_FACTOR);
  });

  it("is zero for an empty list", () => {
    expect(placeCountBounds([])).toEqual({ low: 0, point: 0, high: 0 });
  });
});

describe("ratingBounds", () => {
  it("handles a single value and a range", () => {
    expect(ratingBounds(3)).toEqual({ low: 3, point: 3, high: 3 });
    expect(ratingBounds({ min: 1, max: 2 })).toEqual({ low: 1, point: 1.5, high: 2 });
  });
});

describe("computeItemScore", () => {
  it("keeps low ≤ point ≤ high", () => {
    const result = computeItemScore({
      presence: [...presenceOf(8, "widespread"), ...presenceOf(4, ["marginal", "widespread"])],
      intensity: { value: { min: 1, max: 3 }, sources: [] },
    });
    expect(result.score.low).toBeLessThanOrEqual(result.score.point);
    expect(result.score.point).toBeLessThanOrEqual(result.score.high);
    expect(result.exclusivity.low).toBeLessThanOrEqual(result.exclusivity.high);
  });

  it("gives a zero-width range when no input is uncertain", () => {
    const result = computeItemScore({
      presence: presenceOf(3, "widespread"),
      intensity: { value: 2, sources: [] },
    });
    expect(result.score.low).toBe(result.score.high);
  });
});
