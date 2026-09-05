/**
 * Aspects: named angular relationships between pairs of bodies.
 *
 * The table of angles and orbs is DATA, not logic — schools of astrology
 * disagree about orbs, so a different tradition is a different table fed to
 * the same findAspects().
 */
import { SOLAR_SYSTEM_BODIES, longitudeDelta, type SolarSystemBodyId } from "@/lib/astronomy/solarSystem";
import type { Aspect, AspectDefinition, PlanetPlacement } from "./types";

/** The five Ptolemaic ("major") aspects with commonly used orbs. */
export const MAJOR_ASPECTS: AspectDefinition[] = [
  { name: "conjunction", symbol: "☌", angle: 0, orb: 8 },
  { name: "sextile", symbol: "⚹", angle: 60, orb: 6 },
  { name: "square", symbol: "□", angle: 90, orb: 8 },
  { name: "trine", symbol: "△", angle: 120, orb: 8 },
  { name: "opposition", symbol: "☍", angle: 180, orb: 8 },
];

/** Unsigned angular separation between two longitudes, in [0, 180]. */
export function angularSeparation(a: number, b: number): number {
  return Math.abs(longitudeDelta(a, b));
}

const bodyOrder = new Map<SolarSystemBodyId, number>(SOLAR_SYSTEM_BODIES.map((b, i) => [b, i]));

/**
 * Finds every pair of placements within orb of an aspect in the table.
 * Each pair yields at most one aspect (the tightest, if two definitions
 * somehow overlap). Results are sorted tightest-orb first.
 */
export function findAspects(planets: PlanetPlacement[], table: AspectDefinition[] = MAJOR_ASPECTS): Aspect[] {
  const found: Aspect[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const a = planets[i];
      const b = planets[j];
      const separation = angularSeparation(a.longitude, b.longitude);

      let best: Aspect | null = null;
      for (const def of table) {
        const orb = Math.abs(separation - def.angle);
        if (orb > def.orb) continue;
        if (best && orb >= best.orb) continue;

        // Applying = the separation is moving toward the exact angle.
        // Look a little ahead using each body's speed.
        const step = 0.01; // days
        const futureSeparation = angularSeparation(a.longitude + a.speed * step, b.longitude + b.speed * step);
        const applying = Math.abs(futureSeparation - def.angle) < orb;

        const [first, second] =
          (bodyOrder.get(a.body) ?? 0) <= (bodyOrder.get(b.body) ?? 0) ? [a.body, b.body] : [b.body, a.body];
        best = { name: def.name, symbol: def.symbol, bodies: [first, second], angle: def.angle, separation, orb, applying };
      }
      if (best) found.push(best);
    }
  }
  return found.sort((x, y) => x.orb - y.orb);
}
