/**
 * Birth charts and transits.
 *
 *   BIRTH DATA (date, time, place)  ──►  same engine, at the birth instant  ──►  NATAL CHART
 *   TODAY'S SKY  vs  NATAL CHART    ──►  aspects between the two           ──►  TRANSITS
 *
 * A natal chart is nothing more than the astrology state for a different
 * instant and place, plus the angles/houses (which need the time and place).
 * "Transits" are aspects formed between where a planet is NOW and where a
 * natal planet WAS — this is the raw material horoscopes are written from.
 */
import type { SolarSystemBodyId } from "@/lib/astronomy/solarSystem";
import { getSolarSystemPositions } from "@/lib/astronomy/solarSystem";
import type { Observer } from "@/lib/astronomy/types";
import { getChartAngles, houseOf, wholeSignHouses, type ChartAngles, type House } from "./angles";
import { MAJOR_ASPECTS, angularSeparation, findAspects } from "./aspects";
import { placementFromPosition } from "./engine";
import type { Aspect, AspectDefinition, AstrologyState, PlanetPlacement } from "./types";

export type BirthData = {
  /** Instant of birth (UTC). Built from local date/time + time zone by the UI. */
  instant: Date;
  /** Birth place. */
  location: Observer;
  /** False when the birth time is unknown: angles and houses are then omitted. */
  timeKnown: boolean;
  /** Optional label, e.g. "Sacramento, CA". */
  placeLabel?: string;
};

export type NatalPlacement = PlanetPlacement & {
  /** Whole-sign house, when the birth time is known. */
  house?: House;
};

export type NatalChart = {
  birth: BirthData;
  zodiac: "tropical";
  houseSystem: "whole-sign";
  planets: NatalPlacement[];
  /** Aspects between natal planets. */
  aspects: Aspect[];
  angles?: ChartAngles;
  houses?: House[];
};

export function getNatalChart(birth: BirthData): NatalChart {
  const positions = getSolarSystemPositions(birth.location, birth.instant);
  const base = positions.map(placementFromPosition);
  const angles = birth.timeKnown ? getChartAngles(birth.location, birth.instant) : undefined;
  const houses = angles ? wholeSignHouses(angles.ascendant) : undefined;
  const planets: NatalPlacement[] = base.map((p) => (houses ? { ...p, house: houseOf(p.longitude, houses) } : p));
  // Natal aspects use the same table and finder as the live sky.
  return {
    birth,
    zodiac: "tropical",
    houseSystem: "whole-sign",
    planets,
    aspects: findAspects(base),
    angles,
    houses,
  };
}

/**
 * Transit orbs are conventionally tighter than natal orbs: a transit "counts"
 * only when it is close to exact.
 */
export const TRANSIT_ASPECTS: AspectDefinition[] = MAJOR_ASPECTS.map((a) => ({ ...a, orb: 3 }));

export type Transit = {
  name: Aspect["name"];
  symbol: string;
  /** The moving body in today's sky. */
  transiting: SolarSystemBodyId;
  /** The fixed point in the birth chart. */
  natal: SolarSystemBodyId;
  angle: number;
  separation: number;
  orb: number;
  applying: boolean;
};

/**
 * Aspects between every planet in `now` and every planet in the natal chart.
 * The Moon moves ~13°/day so its transits last hours; Pluto's last years.
 */
export function findTransits(now: AstrologyState, natal: NatalChart, table: AspectDefinition[] = TRANSIT_ASPECTS): Transit[] {
  const out: Transit[] = [];
  for (const t of now.planets) {
    for (const n of natal.planets) {
      const separation = angularSeparation(t.longitude, n.longitude);
      let best: Transit | null = null;
      for (const def of table) {
        const orb = Math.abs(separation - def.angle);
        if (orb > def.orb) continue;
        if (best && orb >= best.orb) continue;
        const future = angularSeparation(t.longitude + t.speed * 0.01, n.longitude);
        best = {
          name: def.name,
          symbol: def.symbol,
          transiting: t.body,
          natal: n.body,
          angle: def.angle,
          separation,
          orb,
          applying: Math.abs(future - def.angle) < orb,
        };
      }
      if (best) out.push(best);
    }
  }
  return out.sort((a, b) => a.orb - b.orb);
}
