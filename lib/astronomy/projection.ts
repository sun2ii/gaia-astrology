/**
 * Projects horizontal coordinates onto a flat "look-up" chart.
 *
 * The chart is the sky dome seen from underneath: the zenith is at the centre,
 * the horizon is the circle at the edge, north is at the top. Because you are
 * looking UP (not down at a map), east is on the LEFT and west on the RIGHT —
 * hold the chart over your head with N pointing north and it matches the sky.
 *
 * Projection: azimuthal equidistant from the zenith. Distance from the centre
 * is proportional to (90° − altitude), so altitude bands are evenly spaced:
 * "halfway up the sky" (45°) is exactly halfway from centre to rim. Shapes are
 * slightly stretched near the horizon, which is acceptable for a finder chart.
 */
import type { HorizontalCoordinates } from "./types";

export type ChartPoint = { x: number; y: number };

/**
 * Converts alt/az to chart coordinates in a box of the given radius, centred
 * on (0, 0). Altitudes below the horizon project beyond the rim (radius > R)
 * so that lines crossing the horizon can be drawn and clipped at the circle.
 */
export function projectToDome(h: HorizontalCoordinates, radius: number): ChartPoint {
  const r = ((90 - h.altitude) / 90) * radius;
  const az = (h.azimuth * Math.PI) / 180;
  return {
    x: -r * Math.sin(az), // east (az 90°) goes LEFT: looking up, not down
    y: -r * Math.cos(az), // north (az 0°) goes UP (SVG y grows downward)
  };
}

/** Inverse of projectToDome, for hit-testing or debugging. */
export function unprojectFromDome(p: ChartPoint, radius: number): HorizontalCoordinates {
  const r = Math.hypot(p.x, p.y);
  const altitude = 90 - (r / radius) * 90;
  let azimuth = (Math.atan2(-p.x, -p.y) * 180) / Math.PI;
  azimuth = ((azimuth % 360) + 360) % 360;
  return { altitude, azimuth };
}

/**
 * Dot radius for a star of the given magnitude, in chart units, for a chart of
 * the given radius. Brighter (lower magnitude) → bigger. Sirius ≈ 6× the area
 * of a magnitude-4 star, which reads well without dominating.
 */
export function starDotRadius(apparentMagnitude: number, chartRadius: number): number {
  const scale = chartRadius / 300; // tuned for a 600-unit-wide chart
  const size = 1.1 + Math.max(0, 5 - apparentMagnitude) * 0.55;
  return size * scale;
}
