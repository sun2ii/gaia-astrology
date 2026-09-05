/**
 * Gives every constellation a colour such that constellations that sit next to
 * each other on the sky never share one. Pure presentation — nothing here is
 * catalog data — so it is computed at load time rather than stored.
 *
 * Method: classic greedy graph colouring. Two constellations are "neighbours"
 * when any star of one figure lies within NEIGHBOUR_DEG of any star of the
 * other (nearest-vertex distance, so a sprawling figure like Ursa Major still
 * counts its small neighbours).
 * Constellations with the most neighbours are coloured first and each takes
 * the first palette colour none of its already-coloured neighbours uses.
 */
import type { Constellation, Star } from "@/lib/astronomy/types";

/** Ten hues tuned to read on the dark chart and stay distinguishable from each other. */
export const CONSTELLATION_PALETTE = [
  "#f6c453", // amber
  "#5ec8f2", // sky blue
  "#f58ea3", // rose
  "#8ee08a", // green
  "#c9a0ff", // lavender
  "#ff9f5b", // orange
  "#5fe3c8", // teal
  "#f2e26b", // yellow
  "#7fa2ff", // periwinkle
  "#e78cf0", // magenta
] as const;

/** Figures whose nearest stars are closer than this (degrees) count as neighbours. */
export const NEIGHBOUR_DEG = 14;

const DEG = Math.PI / 180;

type Vec = [number, number, number];

/** Unit vectors of a constellation's figure stars. */
function figureVectors(c: Constellation, starById: Map<string, Star>): Vec[] {
  const out: Vec[] = [];
  for (const id of new Set(c.lines.flat())) {
    const s = starById.get(id);
    if (!s) continue;
    out.push([Math.cos(s.dec * DEG) * Math.cos(s.ra * DEG), Math.cos(s.dec * DEG) * Math.sin(s.ra * DEG), Math.sin(s.dec * DEG)]);
  }
  return out;
}

function separationDeg(a: Vec, b: Vec): number {
  const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  return Math.acos(Math.min(1, Math.max(-1, dot))) / DEG;
}

/** Smallest angular distance between any star of A and any star of B. */
function nearestDeg(a: Vec[], b: Vec[]): number {
  let best = 180;
  for (const va of a) for (const vb of b) best = Math.min(best, separationDeg(va, vb));
  return best;
}

/** abbreviation -> list of neighbouring abbreviations. */
export function constellationNeighbours(
  constellations: Constellation[],
  stars: Star[],
  neighbourDeg: number = NEIGHBOUR_DEG,
): Map<string, string[]> {
  const starById = new Map(stars.map((s) => [s.id, s]));
  const vectors = new Map(constellations.map((c) => [c.abbreviation, figureVectors(c, starById)] as const));
  const out = new Map<string, string[]>(constellations.map((c) => [c.abbreviation, []]));
  for (let i = 0; i < constellations.length; i++) {
    for (let j = i + 1; j < constellations.length; j++) {
      const a = constellations[i].abbreviation;
      const b = constellations[j].abbreviation;
      if (nearestDeg(vectors.get(a)!, vectors.get(b)!) < neighbourDeg) {
        out.get(a)!.push(b);
        out.get(b)!.push(a);
      }
    }
  }
  return out;
}

/**
 * Returns abbreviation -> colour. Deterministic for a given catalog.
 */
export function assignConstellationColors(
  constellations: Constellation[],
  stars: Star[],
  palette: readonly string[] = CONSTELLATION_PALETTE,
  neighbourDeg: number = NEIGHBOUR_DEG,
): Map<string, string> {
  const neighbours = constellationNeighbours(constellations, stars, neighbourDeg);

  // Most-constrained first, ties broken alphabetically for determinism.
  const order = [...constellations]
    .map((c) => c.abbreviation)
    .sort((a, b) => (neighbours.get(b)?.length ?? 0) - (neighbours.get(a)?.length ?? 0) || a.localeCompare(b));

  const colourIndex = new Map<string, number>();
  for (const abbr of order) {
    const used = new Set((neighbours.get(abbr) ?? []).map((n) => colourIndex.get(n)).filter((i): i is number => i !== undefined));
    let pick = 0;
    while (used.has(pick) && pick < palette.length - 1) pick++;
    if (used.has(pick)) {
      // Palette exhausted for this node: choose the colour used by the fewest neighbours.
      const counts = new Array(palette.length).fill(0);
      for (const n of neighbours.get(abbr) ?? []) {
        const i = colourIndex.get(n);
        if (i !== undefined) counts[i]++;
      }
      pick = counts.indexOf(Math.min(...counts));
    }
    colourIndex.set(abbr, pick);
  }

  return new Map([...colourIndex].map(([abbr, i]) => [abbr, palette[i]]));
}
