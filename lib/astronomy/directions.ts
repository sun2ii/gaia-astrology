/**
 * Turns numeric altitude/azimuth into words a person can act on outside.
 *
 * Azimuth: degrees clockwise from North (0 = N, 90 = E, 180 = S, 270 = W).
 * Altitude: degrees above the horizon (0 = horizon, 90 = overhead).
 */

/** 16-point compass, clockwise from North. Each point covers 22.5°. */
const COMPASS_16 = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
] as const;

export type CompassPoint = (typeof COMPASS_16)[number];

const COMPASS_WORDS: Record<CompassPoint, string> = {
  N: "north",
  NNE: "north-northeast",
  NE: "northeast",
  ENE: "east-northeast",
  E: "east",
  ESE: "east-southeast",
  SE: "southeast",
  SSE: "south-southeast",
  S: "south",
  SSW: "south-southwest",
  SW: "southwest",
  WSW: "west-southwest",
  W: "west",
  WNW: "west-northwest",
  NW: "northwest",
  NNW: "north-northwest",
};

/**
 * 16-point compass direction for an azimuth. We use 16 points rather than 8
 * because "WNW" vs "W" is the difference between finding a star and not
 * finding it when two bright stars are 20° apart along the horizon.
 */
export function azimuthToCompass(azimuth: number): CompassPoint {
  const a = ((azimuth % 360) + 360) % 360;
  const index = Math.round(a / 22.5) % 16;
  return COMPASS_16[index];
}

/** Short 8-point label (N, NE, E, ...), for compact list rows. */
export function azimuthToCompass8(azimuth: number): string {
  const a = ((azimuth % 360) + 360) % 360;
  const points = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return points[Math.round(a / 45) % 8];
}

export function compassToWords(point: CompassPoint): string {
  return COMPASS_WORDS[point];
}

export type AltitudeBand = {
  /** Short label for lists, e.g. "high". */
  label: string;
  /** Sentence fragment, e.g. "high in the sky". */
  phrase: string;
};

/**
 * Altitude bands. Thresholds are inclusive at the lower edge.
 *   0–10   very low on horizon
 *   10–30  low
 *   30–60  halfway up
 *   60–80  high
 *   80–90  nearly overhead
 */
export function describeAltitude(altitude: number): AltitudeBand {
  if (altitude < 0) return { label: "below horizon", phrase: "below the horizon" };
  if (altitude < 10) return { label: "very low", phrase: "very low on the horizon" };
  if (altitude < 30) return { label: "low", phrase: "low in the sky" };
  if (altitude < 60) return { label: "halfway up", phrase: "about halfway up the sky" };
  if (altitude < 80) return { label: "high", phrase: "high in the sky" };
  return { label: "nearly overhead", phrase: "nearly straight overhead" };
}

/**
 * One-sentence instruction, e.g.
 *   "Face west-northwest and look high in the sky."
 *   "Look nearly straight overhead." (direction is meaningless near the zenith)
 */
export function describeWhereToLook(azimuth: number, altitude: number): string {
  const band = describeAltitude(altitude);
  if (altitude >= 80) return `Look ${band.phrase}.`;
  const direction = compassToWords(azimuthToCompass(azimuth));
  return `Face ${direction} and look ${band.phrase}.`;
}

/**
 * Mean direction of several sky positions, done with 3-D vectors so that
 * N (0°) and NNW (350°) average to north rather than to south.
 */
export function meanDirection(items: Array<{ altitude: number; azimuth: number }>): { altitude: number; azimuth: number } | null {
  if (items.length === 0) return null;
  const rad = Math.PI / 180;
  let x = 0, y = 0, z = 0;
  for (const h of items) {
    x += Math.cos(h.altitude * rad) * Math.sin(h.azimuth * rad);
    y += Math.cos(h.altitude * rad) * Math.cos(h.azimuth * rad);
    z += Math.sin(h.altitude * rad);
  }
  const azimuth = ((Math.atan2(x, y) / rad) % 360 + 360) % 360;
  const altitude = Math.atan2(z, Math.hypot(x, y)) / rad;
  return { altitude, azimuth };
}
