/**
 * Where the zodiac is in the observer's sky: the ecliptic line and the twelve
 * sign boundaries, as alt/az points, plus the mapping from sign to the
 * constellation of the same name (which sits ~one sign further along — see
 * the precession note in Learn).
 */
import { createEclipticFrame, eclipticToHorizontal } from "@/lib/astronomy/coordinates";
import type { HorizontalCoordinates, Observer } from "@/lib/astronomy/types";
import { ZODIAC_SIGNS, type ZodiacSign } from "./types";

export const SIGN_CONSTELLATION: Record<ZodiacSign, string> = {
  Aries: "Ari",
  Taurus: "Tau",
  Gemini: "Gem",
  Cancer: "Cnc",
  Leo: "Leo",
  Virgo: "Vir",
  Libra: "Lib",
  Scorpio: "Sco",
  Sagittarius: "Sgr",
  Capricorn: "Cap",
  Aquarius: "Aqr",
  Pisces: "Psc",
};

export const ZODIAC_CONSTELLATIONS = new Set(Object.values(SIGN_CONSTELLATION));

export type ZodiacSky = {
  /** Points along the ecliptic every `stepDeg`, in ecliptic-longitude order. */
  ecliptic: Array<{ longitude: number; horizontal: HorizontalCoordinates }>;
  /** Where each sign's 0° sits in the sky, plus the middle of the slice (for the glyph). */
  signs: Array<{ sign: ZodiacSign; start: HorizontalCoordinates; middle: HorizontalCoordinates }>;
};

export function computeZodiacSky(observer: Observer, date: Date, stepDeg = 2): ZodiacSky {
  const frame = createEclipticFrame(observer, date);
  const ecliptic: ZodiacSky["ecliptic"] = [];
  for (let lon = 0; lon <= 360; lon += stepDeg) ecliptic.push({ longitude: lon % 360, horizontal: eclipticToHorizontal(lon % 360, 0, frame) });
  const signs = ZODIAC_SIGNS.map((sign, i) => ({
    sign,
    start: eclipticToHorizontal(i * 30, 0, frame),
    middle: eclipticToHorizontal(i * 30 + 15, 0, frame),
  }));
  return { ecliptic, signs };
}
