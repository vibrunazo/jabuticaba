import type { Position } from "geojson";
import { describe, expect, it } from "vitest";
import {
  buildWorldGeo,
  polygonsByCode,
  type SourceCountry,
  serializeWorldGeo,
} from "./build-world.ts";

/** A small square polygon centered on (lon, lat). */
function square(lon: number, lat: number): Position[][] {
  const d = 0.5;
  return [
    [
      [lon - d, lat - d],
      [lon - d, lat + d],
      [lon + d, lat + d],
      [lon + d, lat - d],
      [lon - d, lat - d],
    ],
  ];
}

const numericToAlpha2 = (numeric: string) =>
  ({ "250": "FR", "578": "NO", "600": "PY", "196": "CY", "706": "SO" })[numeric];

describe("polygonsByCode", () => {
  it("splits French Guiana out of France", () => {
    const france: SourceCountry = {
      id: "250",
      name: "France",
      geometry: { type: "MultiPolygon", coordinates: [square(2, 47), square(-53, 4)] },
    };
    const result = polygonsByCode([france], numericToAlpha2);
    expect(result.get("FR")).toHaveLength(1);
    expect(result.get("GF")).toHaveLength(1);
  });

  it("splits Svalbard out of Norway", () => {
    const norway: SourceCountry = {
      id: 578,
      name: "Norway",
      geometry: { type: "MultiPolygon", coordinates: [square(10, 62), square(16, 79)] },
    };
    const result = polygonsByCode([norway], numericToAlpha2);
    expect([...result.keys()].sort()).toEqual(["NO", "SJ"]);
  });

  it("draws Crimea as part of Ukraine", () => {
    const russia: SourceCountry = {
      id: "643",
      name: "Russia",
      geometry: { type: "MultiPolygon", coordinates: [square(40, 55), square(34, 45)] },
    };
    const result = polygonsByCode([russia], (n) => ({ "643": "RU" })[n]);
    expect(result.get("RU")).toHaveLength(1);
    expect(result.get("UA")).toHaveLength(1);
  });

  it("codes Kosovo and merges Northern Cyprus into Cyprus", () => {
    const countries: SourceCountry[] = [
      { id: undefined, name: "Kosovo", geometry: { type: "Polygon", coordinates: square(21, 42) } },
      { id: "196", name: "Cyprus", geometry: { type: "Polygon", coordinates: square(33, 34.8) } },
      {
        id: undefined,
        name: "N. Cyprus",
        geometry: { type: "Polygon", coordinates: square(33.5, 35.3) },
      },
      {
        id: undefined,
        name: "Unknown Place",
        geometry: { type: "Polygon", coordinates: square(0, 0) },
      },
    ];
    const result = polygonsByCode(countries, numericToAlpha2);
    expect(result.get("XK")).toHaveLength(1);
    expect(result.get("CY")).toHaveLength(2);
    expect(result.size).toBe(2);
  });
});

describe("buildWorldGeo", () => {
  it("draws coarse shapes and turns missing small places into points", () => {
    const shapes = new Map([["PY", [square(-58, -23)]]]);
    const detail = new Map([
      ["PY", [square(-58, -23)]],
      ["SG", [square(103.8, 1.35)]],
    ]);
    const geo = buildWorldGeo(shapes, detail);
    expect(geo.features.map((f) => [f.properties.code, f.geometry.type])).toEqual([
      ["PY", "Polygon"],
      ["SG", "Point"],
    ]);
  });

  it("serializes one feature per line", () => {
    const geo = buildWorldGeo(new Map([["PY", [square(-58, -23)]]]), new Map());
    const text = serializeWorldGeo(geo);
    expect(text.split("\n")).toHaveLength(4);
    expect(JSON.parse(text).features[0].properties.code).toBe("PY");
  });
});
