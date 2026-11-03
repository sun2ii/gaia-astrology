/**
 * Builds data/earth.json — the land outlines drawn on the little Earth at the
 * centre of the sky sphere.
 *
 * Source: world-atlas (npm) → Natural Earth 1:110m land polygons, public domain.
 * Output: { source, resolution, rings: number[][][] } where each ring is a
 * closed list of [longitude, latitude] pairs in degrees, rounded to 0.1°.
 *
 *   npm run data:earth
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";


type Ring = number[][];

const land = JSON.parse(readFileSync(path.join(process.cwd(), "node_modules", "world-atlas", "land-110m.json"), "utf8"));
const topo = land as unknown as Topology<{ land: GeometryCollection }>;
const geo = feature(topo, topo.objects.land);

const rings: Ring[] = [];
for (const f of geo.features) {
  const g = f.geometry;
  const polys = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
  for (const poly of polys) {
    for (const ring of poly) {
      rings.push(ring.map(([lon, lat]) => [Math.round(lon * 10) / 10, Math.round(lat * 10) / 10]));
    }
  }
}

const out = {
  source: "Natural Earth 1:110m land (public domain), via world-atlas@2 on npm",
  resolution: "110m",
  generated: new Date().toISOString().slice(0, 10),
  rings,
};
const file = path.join(process.cwd(), "data", "earth.json");
writeFileSync(file, JSON.stringify(out));
console.log(`wrote ${file}: ${rings.length} rings, ${rings.reduce((n, r) => n + r.length, 0)} points`);
