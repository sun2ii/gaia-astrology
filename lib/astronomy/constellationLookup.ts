/**
 * Which IAU constellation contains a given J2000 RA/Dec.
 *
 * Uses the official boundaries (Delporte 1930) as tabulated by Roman (1987,
 * PASP 99, 695; VizieR VI/42). The boundaries are defined in the B1875.0
 * equinox, so the position is precessed from J2000 to B1875 first (rigorous
 * formulae from Meeus, "Astronomical Algorithms", ch. 21), then looked up.
 *
 * Used by the data build (to label every star) and at runtime (to say which
 * constellation the Sun, Moon or a planet is currently in).
 */

export type ConstellationBoundary = {
  raLow: number; // hours, B1875
  raHigh: number; // hours, B1875
  decLow: number; // degrees, B1875
  constellation: string;
};

const DEG = Math.PI / 180;

/** Parses VizieR VI/42 data.dat: "RAlow RAhigh DecLow Con" per line. */
export function parseBoundaryTable(text: string): ConstellationBoundary[] {
  const out: ConstellationBoundary[] = [];
  for (const line of text.split("\n")) {
    const parts = line.trim().split(/\s+/);
    if (parts.length !== 4) continue;
    out.push({ raLow: Number(parts[0]), raHigh: Number(parts[1]), decLow: Number(parts[2]), constellation: parts[3] });
  }
  return out;
}

/** Precesses J2000.0 equatorial coordinates (degrees) to B1875.0. */
export function precessJ2000ToB1875(raDeg: number, decDeg: number): { raHours: number; decDeg: number } {
  const JD_B1875 = 2405889.25855;
  const JD_J2000 = 2451545.0;
  const t = (JD_B1875 - JD_J2000) / 36525; // centuries from J2000 (negative)
  const T = 0; // starting epoch is J2000
  const arcsec = 1 / 3600;
  const zeta = ((2306.2181 + 1.39656 * T - 0.000139 * T * T) * t + (0.30188 - 0.000344 * T) * t * t + 0.017998 * t ** 3) * arcsec * DEG;
  const z = ((2306.2181 + 1.39656 * T - 0.000139 * T * T) * t + (1.09468 + 0.000066 * T) * t * t + 0.018203 * t ** 3) * arcsec * DEG;
  const theta = ((2004.3109 - 0.8533 * T - 0.000217 * T * T) * t - (0.42665 + 0.000217 * T) * t * t - 0.041833 * t ** 3) * arcsec * DEG;

  const ra = raDeg * DEG;
  const dec = decDeg * DEG;
  const A = Math.cos(dec) * Math.sin(ra + zeta);
  const B = Math.cos(theta) * Math.cos(dec) * Math.cos(ra + zeta) - Math.sin(theta) * Math.sin(dec);
  const C = Math.sin(theta) * Math.cos(dec) * Math.cos(ra + zeta) + Math.cos(theta) * Math.sin(dec);
  let ra1875 = Math.atan2(A, B) + z;
  const dec1875 = Math.asin(C);
  ra1875 = ((ra1875 % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return { raHours: ra1875 / DEG / 15, decDeg: dec1875 / DEG };
}

/** Returns the IAU abbreviation for a J2000 position (degrees). */
export function constellationAt(raDeg: number, decDeg: number, boundaries: ConstellationBoundary[]): string {
  const { raHours, decDeg: dec } = precessJ2000ToB1875(raDeg, decDeg);
  for (const b of boundaries) {
    if (dec < b.decLow) continue;
    if (raHours < b.raLow) continue;
    if (raHours >= b.raHigh) continue;
    return b.constellation;
  }
  throw new Error(`No constellation found for RA=${raDeg} Dec=${decDeg}`);
}
