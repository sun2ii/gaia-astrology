/**
 * Astrology types. Everything here is CALCULATION: a deterministic, symbolic
 * re-labelling of the physical sky state produced by lib/astronomy/. No
 * interpretation ("Mercury in Virgo means…") lives in this layer.
 */
import type { SolarSystemBodyId } from "@/lib/astronomy/solarSystem";

export const ZODIAC_SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;

export type ZodiacSign = (typeof ZODIAC_SIGNS)[number];

export const ZODIAC_SYMBOLS: Record<ZodiacSign, string> = {
  Aries: "♈",
  Taurus: "♉",
  Gemini: "♊",
  Cancer: "♋",
  Leo: "♌",
  Virgo: "♍",
  Libra: "♎",
  Scorpio: "♏",
  Sagittarius: "♐",
  Capricorn: "♑",
  Aquarius: "♒",
  Pisces: "♓",
};

/** A position on the tropical zodiac: sign + degrees into that sign [0, 30). */
export type ZodiacPosition = {
  sign: ZodiacSign;
  degree: number;
  /** Original ecliptic longitude, [0, 360). */
  longitude: number;
};

export type PlanetPlacement = {
  body: SolarSystemBodyId;
  /** Geocentric apparent ecliptic longitude of date, degrees [0, 360). */
  longitude: number;
  zodiac: ZodiacPosition;
  /** Degrees per day along the ecliptic; negative while retrograde. */
  speed: number;
  retrograde: boolean;
};

export type AspectName = "conjunction" | "sextile" | "square" | "trine" | "opposition";

/** One row of the aspect table. Different traditions = different tables, same engine. */
export type AspectDefinition = {
  name: AspectName;
  symbol: string;
  angle: number;
  /** Maximum allowed deviation from the exact angle, degrees. */
  orb: number;
};

export type Aspect = {
  name: AspectName;
  symbol: string;
  /** The two bodies, in SOLAR_SYSTEM_BODIES order (Sun before Moon before Mercury …). */
  bodies: [SolarSystemBodyId, SolarSystemBodyId];
  /** Exact angle of this aspect type (0, 60, 90, 120, 180). */
  angle: number;
  /** Actual angular separation between the bodies, degrees [0, 180]. */
  separation: number;
  /** |separation − angle|, degrees. Smaller = tighter. */
  orb: number;
  /** True if the bodies are moving toward the exact angle, false if moving apart. */
  applying: boolean;
};

export type AstrologyState = {
  timestamp: Date;
  location: { latitude: number; longitude: number };
  /** Which zodiac is in use. Only "tropical" is implemented. */
  zodiac: "tropical";
  planets: PlanetPlacement[];
  aspects: Aspect[];
};
