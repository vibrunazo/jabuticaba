/**
 * `pnpm geo [--check]`: builds data/geo/world.geo.json from the Natural Earth
 * data in the `world-atlas` package (public domain), or verifies it is up to date.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import countries from "i18n-iso-countries";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import {
  buildWorldGeo,
  polygonsByCode,
  type SourceCountry,
  serializeWorldGeo,
} from "../src/geo/build-world.ts";
import { writeOrCheck } from "./cli.ts";

const require = createRequire(import.meta.url);

function readCountries(resolution: "110m" | "50m"): SourceCountry[] {
  const file = require.resolve(`world-atlas/countries-${resolution}.json`);
  const topology = JSON.parse(readFileSync(file, "utf8")) as Topology<{
    countries: GeometryCollection<{ name: string }>;
  }>;
  const collection = feature(topology, topology.objects.countries) as FeatureCollection<
    Polygon | MultiPolygon | null,
    { name: string }
  >;
  return collection.features.map((f) => ({
    id: f.id,
    name: f.properties.name,
    geometry: f.geometry as Polygon | MultiPolygon | null,
  }));
}

const numericToAlpha2 = (numeric: string) => countries.numericToAlpha2(numeric);
const geo = buildWorldGeo(
  polygonsByCode(readCountries("110m"), numericToAlpha2),
  polygonsByCode(readCountries("50m"), numericToAlpha2),
);

if (!writeOrCheck("data/geo/world.geo.json", serializeWorldGeo(geo), "pnpm geo")) {
  process.exitCode = 1;
}
