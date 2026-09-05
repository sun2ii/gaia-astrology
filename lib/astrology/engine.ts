/**
 * The astrology engine: sky state in, astrology state out. Deterministic,
 * location-aware only through the astronomy layer, and free of any prose.
 *
 *   LOCATION + TIME
 *        │
 *        ▼  lib/astronomy/solarSystem.ts      (physical: alt/az, ecliptic longitude, speed)
 *   CELESTIAL POSITIONS
 *        │
 *        ▼  this file                         (symbolic: signs, retrograde, aspects)
 *   ASTROLOGY STATE
 */
import { getSolarSystemPositions, type BodyPosition } from "@/lib/astronomy/solarSystem";
import type { Observer } from "@/lib/astronomy/types";
import { MAJOR_ASPECTS, findAspects } from "./aspects";
import type { AspectDefinition, AstrologyState, PlanetPlacement } from "./types";
import { zodiacPosition } from "./zodiac";

/**
 * Below this speed (deg/day) a body is treated as stationary rather than
 * retrograde/direct, to avoid flickering exactly at a station. The Sun moves
 * ~1°/day, the Moon ~13°/day, Pluto ~0.03°/day at most, so this is far below
 * any body's normal motion.
 */
export const STATION_THRESHOLD_DEG_PER_DAY = 0.0005;

export function placementFromPosition(p: BodyPosition): PlanetPlacement {
  return {
    body: p.id,
    longitude: p.eclipticLongitude,
    zodiac: zodiacPosition(p.eclipticLongitude),
    speed: p.eclipticSpeedDegPerDay,
    retrograde: p.eclipticSpeedDegPerDay < -STATION_THRESHOLD_DEG_PER_DAY,
  };
}

/** Builds the astrology state from already-computed body positions (no double ephemeris work). */
export function astrologyStateFromPositions(
  positions: BodyPosition[],
  observer: Observer,
  date: Date,
  aspectTable: AspectDefinition[] = MAJOR_ASPECTS,
): AstrologyState {
  const planets = positions.map(placementFromPosition);
  return {
    timestamp: date,
    location: { latitude: observer.latitude, longitude: observer.longitude },
    zodiac: "tropical",
    planets,
    aspects: findAspects(planets, aspectTable),
  };
}

/** Convenience: compute everything from scratch. */
export function getAstrologyState(observer: Observer, date: Date, aspectTable?: AspectDefinition[]): AstrologyState {
  return astrologyStateFromPositions(getSolarSystemPositions(observer, date), observer, date, aspectTable);
}
