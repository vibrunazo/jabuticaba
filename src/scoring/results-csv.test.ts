import { describe, expect, it } from "vitest";
import { makeItem, makePresence } from "../testing/make-item.ts";
import { METHODOLOGY_VERSION } from "./constants.ts";
import { computeResults, toCsv } from "./results-csv.ts";

describe("computeResults", () => {
  it("ranks by score, then by id", () => {
    const common = makeItem({
      id: "common",
      presence: Array.from({ length: 30 }, (_, i) => makePresence(`P${i}`, "widespread")),
    });
    const rareB = makeItem({ id: "rare-b", presence: [] });
    const rareA = makeItem({ id: "rare-a", presence: [] });
    const ids = computeResults([common, rareB, rareA]).map((r) => [r.rank, r.id]);
    expect(ids).toEqual([
      [1, "rare-a"],
      [2, "rare-b"],
      [3, "common"],
    ]);
  });
});

describe("toCsv", () => {
  it("writes a header and one line per item", () => {
    const csv = toCsv(computeResults([makeItem({ presence: [] })]));
    expect(csv).toBe(
      "rank,id,status,score,scoreLow,scoreHigh,exclusivity,placeCount,intensity,evidenceGrade,methodologyVersion\n" +
        `1,test-item,mock,100,100,100,1.0000,0.0000,2.0000,A,${METHODOLOGY_VERSION}\n`,
    );
  });
});
