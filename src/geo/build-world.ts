/**
 * Turns Natural Earth country shapes (from the `world-atlas` package) into our
 * world geometry, keyed by ISO 3166-1 alpha-2. Pure functions: no I/O.
 * Spec: docs/design/01-index-methodology-v0.md, section 9 (map geometry).
 *
 * Natural Earth bundles some overseas territories into their sovereign state
 * (French Guiana inside France, Svalbard inside Norway…). We split those parts
 * out, because the index counts territories separately.
 */
import { geoCentroid } from "d3-geo";
import type { Feature, FeatureCollection, MultiPolygon, Point, Polygon, Position } from "geojson";

export interface SourceCountry {
  /** ISO 3166-1 numeric code, e.g. "076"; missing for a few disputed areas. */
  id: string | number | undefined;
  name: string;
  geometry: Polygon | MultiPolygon | null;
}

export type PlaceFeature = Feature<Polygon | MultiPolygon | Point, { code: string }>;
export type WorldGeo = FeatureCollection<Polygon | MultiPolygon | Point, { code: string }>;

interface PartSplit {
  from: string;
  to: string;
  /** Tested against the centroid of each polygon of the `from` country. */
  contains: (lon: number, lat: number) => boolean;
}

/** Overseas parts to split out of their sovereign state's shape. */
export const PART_SPLITS: readonly PartSplit[] = [
  { from: "FR", to: "GF", contains: (lon, lat) => lon > -55 && lon < -51 && lat > 1 && lat < 7 },
  {
    from: "FR",
    to: "GP",
    contains: (lon, lat) => lon > -62 && lon < -60.8 && lat > 15.8 && lat < 16.6,
  },
  {
    from: "FR",
    to: "MQ",
    contains: (lon, lat) => lon > -61.3 && lon < -60.7 && lat > 14.3 && lat < 15,
  },
  {
    from: "FR",
    to: "RE",
    contains: (lon, lat) => lon > 55 && lon < 56 && lat > -21.5 && lat < -20.8,
  },
  {
    from: "FR",
    to: "YT",
    contains: (lon, lat) => lon > 44.9 && lon < 45.4 && lat > -13.1 && lat < -12.5,
  },
  // Svalbard (far north) and Jan Mayen (west of Norway) share the code SJ.
  { from: "NO", to: "SJ", contains: (lon, lat) => lat > 70.5 && (lat > 74 || lon < -5) },
  // Bonaire, Sint Eustatius and Saba.
  { from: "NL", to: "BQ", contains: (lon) => lon < -60 },
];

/**
 * Natural Earth features without an ISO numeric code. Following ISO 3166-1,
 * Northern Cyprus and Somaliland are drawn as part of Cyprus and Somalia.
 */
export const UNCODED_FEATURES: Readonly<Record<string, string>> = {
  Kosovo: "XK",
  "N. Cyprus": "CY",
  Somaliland: "SO",
};

const COORDINATE_DECIMALS = 2;

function round(position: Position): Position {
  const factor = 10 ** COORDINATE_DECIMALS;
  return position.map((value) => Math.round(value * factor) / factor);
}

function polygonsOf(geometry: Polygon | MultiPolygon): Position[][][] {
  return geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
}

/** Groups every polygon under its alpha-2 code, applying PART_SPLITS. */
export function polygonsByCode(
  countries: readonly SourceCountry[],
  numericToAlpha2: (numeric: string) => string | undefined,
): Map<string, Position[][][]> {
  const result = new Map<string, Position[][][]>();
  for (const country of countries) {
    const code =
      country.id === undefined
        ? UNCODED_FEATURES[country.name]
        : numericToAlpha2(String(country.id).padStart(3, "0"));
    if (!code || !country.geometry) {
      continue;
    }
    for (const polygon of polygonsOf(country.geometry)) {
      const [lon = 0, lat = 0] = geoCentroid({ type: "Polygon", coordinates: polygon });
      const split = PART_SPLITS.find((s) => s.from === code && s.contains(lon, lat));
      const target = split?.to ?? code;
      result.set(target, [...(result.get(target) ?? []), polygon]);
    }
  }
  return result;
}

function shapeGeometry(polygons: Position[][][]): Polygon | MultiPolygon {
  const rounded = polygons.map((polygon) => polygon.map((ring) => ring.map(round)));
  const [only] = rounded;
  return rounded.length === 1 && only
    ? { type: "Polygon", coordinates: only }
    : { type: "MultiPolygon", coordinates: rounded };
}

/**
 * Shapes come from the coarse `shapes` data (small file, fast to draw). Places
 * too small to appear there but present in the finer `detail` data become points,
 * so they can still be marked on the map.
 */
export function buildWorldGeo(
  shapes: Map<string, Position[][][]>,
  detail: Map<string, Position[][][]>,
): WorldGeo {
  const features: PlaceFeature[] = [];
  for (const [code, polygons] of shapes) {
    features.push({ type: "Feature", properties: { code }, geometry: shapeGeometry(polygons) });
  }
  for (const [code, polygons] of detail) {
    if (shapes.has(code)) {
      continue;
    }
    const centroid = geoCentroid({ type: "MultiPolygon", coordinates: polygons });
    features.push({
      type: "Feature",
      properties: { code },
      geometry: { type: "Point", coordinates: round(centroid) },
    });
  }
  features.sort((a, b) => a.properties.code.localeCompare(b.properties.code));
  return { type: "FeatureCollection", features };
}

/** One feature per line: small diffs when the geometry is regenerated. */
export function serializeWorldGeo(geo: WorldGeo): string {
  const lines = geo.features.map((feature) => JSON.stringify(feature));
  return `{"type":"FeatureCollection","features":[\n${lines.join(",\n")}\n]}\n`;
}
