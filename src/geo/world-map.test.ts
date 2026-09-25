import { describe, expect, it } from "vitest";
import type { WorldGeo } from "./build-world.ts";
import { MAP_HEIGHT, MAP_WIDTH, projectWorld } from "./world-map.ts";

/** Brazil-ish square and Japan-ish square, plus a point for Singapore. */
const geo: WorldGeo = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { code: "BR" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-60, -20],
            [-60, 0],
            [-40, 0],
            [-40, -20],
            [-60, -20],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { code: "SG" },
      geometry: { type: "Point", coordinates: [103.8, 1.35] },
    },
  ],
};

describe("projectWorld", () => {
  it("projects shapes and points inside the map", () => {
    const world = projectWorld(geo, "standard");
    expect(world.shapes.map((s) => s.code)).toEqual(["BR"]);
    expect(world.shapes[0]?.d).toMatch(/^M/);
    const [point] = world.points;
    expect(point?.code).toBe("SG");
    expect(point?.x).toBeGreaterThan(0);
    expect(point?.x).toBeLessThan(MAP_WIDTH);
    expect(point?.y).toBeGreaterThan(0);
    expect(point?.y).toBeLessThan(MAP_HEIGHT);
    expect(world.sphere).not.toBe("");
  });

  it("puts Brazil in the middle, south up, in the brazil-centered projection", () => {
    const world = projectWorld(
      {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { code: "BR" },
            geometry: { type: "Point", coordinates: [-50, -10] },
          },
          {
            type: "Feature",
            properties: { code: "AR" },
            geometry: { type: "Point", coordinates: [-50, -40] },
          },
        ],
      },
      "brazil-centered",
    );
    const brazil = world.points.find((p) => p.code === "BR");
    const south = world.points.find((p) => p.code === "AR");
    expect(brazil?.x).toBeCloseTo(MAP_WIDTH / 2, 0);
    // South up: the southern point is drawn above (smaller y) the northern one.
    expect(south?.y ?? 0).toBeLessThan(brazil?.y ?? 0);
  });
});
