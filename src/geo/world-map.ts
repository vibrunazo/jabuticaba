/**
 * Projects the world geometry into SVG path data, at build time. Pure functions.
 * Spec: docs/design/01-index-methodology-v0.md, section 9 (map geometry).
 */
import { type GeoProjection, geoEqualEarth, geoGraticule10, geoPath } from "d3-geo";
import type { PlaceFeature, WorldGeo } from "./build-world.ts";

export const PROJECTIONS = ["brazil-centered", "standard"] as const;
export type ProjectionName = (typeof PROJECTIONS)[number];

/**
 * `brazil-centered` ("Sovereign") follows IBGE's south-up world maps: Equal Earth,
 * centered on 60° W, rotated 180°. `standard` ("Colonial") is Equal Earth, north up,
 * centered on Greenwich. Default in every locale: `brazil-centered`.
 */
export const DEFAULT_PROJECTION: ProjectionName = "brazil-centered";

/**
 * Longitude placed at the center of the brazil-centered projection: 60° W, as on
 * IBGE's official south-up world maps. Its antimeridian (120° E) runs between
 * mainland China and Taiwan and through Russia.
 */
export const BRAZIL_CENTER_LONGITUDE = -60;

/** SVG viewBox size; the map scales to its container. Both projections are about 2:1. */
export const MAP_WIDTH = 960;
export const MAP_HEIGHT = 470;
const MAP_PADDING = 4;

/** Path coordinates are rounded to whole units of the 960-wide viewBox, to keep the HTML small. */
const PATH_DIGITS = 0;

export interface ProjectedShape {
  code: string;
  d: string;
}

export interface ProjectedPoint {
  code: string;
  x: number;
  y: number;
}

export interface ProjectedWorld {
  sphere: string;
  graticule: string;
  shapes: ProjectedShape[];
  points: ProjectedPoint[];
}

function makeProjection(name: ProjectionName): GeoProjection {
  const projection = geoEqualEarth();
  if (name === "brazil-centered") {
    // [λ, φ, γ]: bring BRAZIL_CENTER_LONGITUDE to the middle, then turn the map 180°.
    projection.rotate([-BRAZIL_CENTER_LONGITUDE, 0, 180]);
  }
  return projection.fitExtent(
    [
      [MAP_PADDING, MAP_PADDING],
      [MAP_WIDTH - MAP_PADDING, MAP_HEIGHT - MAP_PADDING],
    ],
    { type: "Sphere" },
  );
}

export function projectWorld(geo: WorldGeo, name: ProjectionName): ProjectedWorld {
  const projection = makeProjection(name);
  const path = geoPath(projection).digits(PATH_DIGITS);
  const shapes: ProjectedShape[] = [];
  const points: ProjectedPoint[] = [];
  for (const feature of geo.features as PlaceFeature[]) {
    const { code } = feature.properties;
    if (feature.geometry.type === "Point") {
      const projected = projection(feature.geometry.coordinates as [number, number]);
      if (projected) {
        points.push({ code, x: round(projected[0]), y: round(projected[1]) });
      }
      continue;
    }
    const d = path(feature);
    if (d) {
      shapes.push({ code, d });
    }
  }
  return {
    sphere: path({ type: "Sphere" }) ?? "",
    graticule: path(geoGraticule10()) ?? "",
    shapes,
    points,
  };
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
