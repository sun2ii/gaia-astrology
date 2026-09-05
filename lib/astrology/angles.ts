/**
 * The angles of a chart — Ascendant and Midheaven — and whole-sign houses.
 *
 * Plain-English version
 * ---------------------
 * The ecliptic (the planets' road) crosses your horizon in two places at any
 * moment. The point where it is RISING in the east is the **Ascendant**; the
 * sign that point falls in is your "rising sign". The point where the ecliptic
 * crosses your north–south line (the meridian) is the **Midheaven** — the
 * culminating point of the zodiac. Both depend on WHERE you are and the exact MINUTE, which is why
 * a birth chart needs a birth time and place while a Sun sign only needs a date.
 *
 * Houses divide the sky into 12 "areas of life" starting from the Ascendant.
 * There are many schemes; V1 uses **whole-sign houses** (the oldest and simplest):
 * the sign containing the Ascendant is house 1, the next sign house 2, and so on.
 *
 * Maths: standard spherical astronomy (Meeus, "Astronomical Algorithms" ch. 12
 * and the classic Ascendant formula). Local sidereal time and the obliquity of
 * the ecliptic come from astronomy-engine.
 */
import { MakeTime, SiderealTime, e_tilt } from "astronomy-engine";
import type { Observer } from "@/lib/astronomy/types";
import type { ZodiacPosition, ZodiacSign } from "./types";
import { ZODIAC_SIGNS } from "./types";
import { normalizeLongitude, zodiacPosition } from "./zodiac";

const DEG = Math.PI / 180;

export type ChartAngles = {
  /** Ecliptic longitude of the eastern horizon point (degrees) and its sign. */
  ascendant: ZodiacPosition;
  /** Ecliptic longitude of the point on the meridian (degrees) and its sign. */
  midheaven: ZodiacPosition;
  /** Right ascension of the Midheaven, degrees — the local sidereal time as an angle. */
  ramc: number;
  /** True obliquity of the ecliptic used, degrees. */
  obliquity: number;
};

/** Local sidereal time as an angle (RAMC), degrees [0, 360). */
export function localSiderealTimeDeg(date: Date, longitudeEast: number): number {
  const gastHours = SiderealTime(date);
  return normalizeLongitude(gastHours * 15 + longitudeEast);
}

/** True obliquity of the ecliptic at the instant, degrees. */
export function obliquityDeg(date: Date): number {
  return e_tilt(MakeTime(date)).tobl;
}

export function getChartAngles(observer: Observer, date: Date): ChartAngles {
  const ramc = localSiderealTimeDeg(date, observer.longitude);
  const eps = obliquityDeg(date);
  const R = ramc * DEG;
  const E = eps * DEG;
  const phi = observer.latitude * DEG;

  // Midheaven: where the ecliptic crosses the meridian.
  const mc = Math.atan2(Math.sin(R), Math.cos(R) * Math.cos(E)) / DEG;

  // Ascendant: where the ecliptic crosses the eastern horizon.
  const asc = Math.atan2(Math.cos(R), -(Math.sin(R) * Math.cos(E) + Math.tan(phi) * Math.sin(E))) / DEG;

  return {
    ascendant: zodiacPosition(asc),
    midheaven: zodiacPosition(mc),
    ramc,
    obliquity: eps,
  };
}

export type House = {
  /** 1–12. */
  number: number;
  /** The sign occupying this house (whole-sign system). */
  sign: ZodiacSign;
  /** Ecliptic longitude where the house begins (the 0° of its sign). */
  cuspLongitude: number;
};

/** Whole-sign houses: house 1 is the whole sign that contains the Ascendant. */
export function wholeSignHouses(ascendant: ZodiacPosition): House[] {
  const start = ZODIAC_SIGNS.indexOf(ascendant.sign);
  return Array.from({ length: 12 }, (_, i) => {
    const signIndex = (start + i) % 12;
    return { number: i + 1, sign: ZODIAC_SIGNS[signIndex], cuspLongitude: signIndex * 30 };
  });
}

/** Which whole-sign house a longitude falls in, given the houses. */
export function houseOf(longitude: number, houses: House[]): House {
  const sign = zodiacPosition(longitude).sign;
  return houses.find((h) => h.sign === sign) ?? houses[0];
}
