/**
 * The Sun, Moon and planets — the "wanderers" that the star catalog cannot
 * cover because they move. Everything here is ASTRONOMY: physical positions
 * from the astronomy-engine ephemeris. The astrology layer (lib/astrology/)
 * consumes the ecliptic longitudes computed here and transforms them.
 *
 * Two coordinate systems come out of this module, on purpose:
 *
 *   horizontal (alt/az, topocentric)      — where to look, for THIS observer.
 *   ecliptic longitude (geocentric, of date) — position along the Sun's path,
 *        measured from the equinox as it is NOW. This is the number astrology
 *        divides into 12 signs. Geocentric because that is the convention;
 *        "of date" because the equinox drifts (precession) and the tropical
 *        zodiac follows it.
 */
import boundariesJson from "@/data/constellation_boundaries.json";
import {
  Body,
  Ecliptic,
  Equator,
  GeoVector,
  Horizon,
  Illumination,
  Observer as EngineObserver,
} from "astronomy-engine";
import { constellationName } from "./constellations";
import { constellationAt, type ConstellationBoundary } from "./constellationLookup";
import type { HorizontalCoordinates, Observer } from "./types";

export const SOLAR_SYSTEM_BODIES = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
] as const;

export type SolarSystemBodyId = (typeof SOLAR_SYSTEM_BODIES)[number];

export const BODY_INFO: Record<SolarSystemBodyId, { name: string; symbol: string; engine: Body }> = {
  sun: { name: "Sun", symbol: "☉", engine: Body.Sun },
  moon: { name: "Moon", symbol: "☽", engine: Body.Moon },
  mercury: { name: "Mercury", symbol: "☿", engine: Body.Mercury },
  venus: { name: "Venus", symbol: "♀", engine: Body.Venus },
  mars: { name: "Mars", symbol: "♂", engine: Body.Mars },
  jupiter: { name: "Jupiter", symbol: "♃", engine: Body.Jupiter },
  saturn: { name: "Saturn", symbol: "♄", engine: Body.Saturn },
  uranus: { name: "Uranus", symbol: "♅", engine: Body.Uranus },
  neptune: { name: "Neptune", symbol: "♆", engine: Body.Neptune },
  pluto: { name: "Pluto", symbol: "♇", engine: Body.Pluto },
};

/** Interval used to estimate how fast a body moves along the ecliptic. */
const SPEED_SAMPLE_MS = 60 * 60 * 1000; // 1 hour

export type BodyPosition = {
  id: SolarSystemBodyId;
  name: string;
  symbol: string;

  /** Where to look, for this observer, right now. Topocentric, no refraction. */
  horizontal: HorizontalCoordinates;

  /** J2000 equatorial position (degrees), geocentric — same frame as stars.json. */
  ra: number;
  dec: number;

  /** IAU constellation the body currently sits in (astronomy, not the zodiac sign). */
  constellation: string;
  constellationName: string;

  /** Geocentric apparent ecliptic longitude/latitude of date, degrees. Longitude in [0, 360). */
  eclipticLongitude: number;
  eclipticLatitude: number;

  /** Rate of change of ecliptic longitude, degrees per day. Negative = retrograde. */
  eclipticSpeedDegPerDay: number;

  /** Apparent visual magnitude (Sun ≈ −26.7, full Moon ≈ −12.7, Pluto ≈ +14). */
  apparentMagnitude: number;

  /** Fraction of the disc illuminated (meaningful for the Moon and inner planets). */
  illuminatedFraction: number;
};

const BOUNDARIES = (boundariesJson as { boundaries: ConstellationBoundary[] }).boundaries;

function normalizeDegrees(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** Geocentric apparent ecliptic longitude/latitude of date, in degrees. */
export function geocentricEclipticOfDate(engineBody: Body, date: Date): { longitude: number; latitude: number } {
  const vector = GeoVector(engineBody, date, true); // aberration-corrected, J2000 equatorial
  const ecl = Ecliptic(vector); // true ecliptic of date
  return { longitude: normalizeDegrees(ecl.elon), latitude: ecl.elat };
}

/** Signed change in longitude from a to b, in (-180, 180]. */
export function longitudeDelta(from: number, to: number): number {
  let d = normalizeDegrees(to) - normalizeDegrees(from);
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

export function getBodyPosition(id: SolarSystemBodyId, observer: Observer, date: Date): BodyPosition {
  const info = BODY_INFO[id];
  const engineObserver = new EngineObserver(observer.latitude, observer.longitude, 0);

  // Where to look: of-date, topocentric equatorial -> horizontal. No refraction (consistent with stars).
  const ofDate = Equator(info.engine, date, engineObserver, true, true);
  const hor = Horizon(date, engineObserver, ofDate.ra, ofDate.dec, undefined);

  // Constellation: J2000 geocentric position against the IAU boundaries.
  const j2000 = Equator(info.engine, date, engineObserver, false, true);
  const ra = j2000.ra * 15;
  const dec = j2000.dec;
  const constellation = constellationAt(ra, dec, BOUNDARIES);

  // Ecliptic longitude now and one hour later -> speed.
  const now = geocentricEclipticOfDate(info.engine, date);
  const later = geocentricEclipticOfDate(info.engine, new Date(date.getTime() + SPEED_SAMPLE_MS));
  const speedPerDay = longitudeDelta(now.longitude, later.longitude) * (24 * 60 * 60 * 1000 / SPEED_SAMPLE_MS);

  const illum = Illumination(info.engine, date);

  return {
    id,
    name: info.name,
    symbol: info.symbol,
    horizontal: { altitude: hor.altitude, azimuth: normalizeDegrees(hor.azimuth) },
    ra,
    dec,
    constellation,
    constellationName: constellationName(constellation),
    eclipticLongitude: now.longitude,
    eclipticLatitude: now.latitude,
    eclipticSpeedDegPerDay: speedPerDay,
    apparentMagnitude: illum.mag,
    illuminatedFraction: illum.phase_fraction,
  };
}

/** All ten bodies, in the conventional order Sun, Moon, Mercury … Pluto. */
export function getSolarSystemPositions(observer: Observer, date: Date): BodyPosition[] {
  return SOLAR_SYSTEM_BODIES.map((id) => getBodyPosition(id, observer, date));
}
