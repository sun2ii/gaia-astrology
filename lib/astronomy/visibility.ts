/**
 * Which catalog stars are up right now, for a given observer and instant.
 *
 * "Visible" in V1 means GEOMETRICALLY above the horizon. It does not promise
 * you will actually see the star: light pollution, weather, haze, the Moon,
 * your eyesight and whatever is blocking your horizon all matter and are
 * out of scope for now. See README.md ("What visibility means").
 */
import { createSkyFrame, toHorizontal } from "./coordinates";
import type { Observer, Star, VisibleStar } from "./types";

/** Above this altitude a star is geometrically above the horizon. */
export const HORIZON_ALTITUDE_DEG = 0;

/**
 * Below this altitude stars are technically up but sit in the murk near the
 * horizon, where they are hard to find and easy to confuse with planets, planes
 * and streetlights. The UI hides them by default. Configurable.
 */
export const DEFAULT_USEFUL_ALTITUDE_DEG = 10;

export type GetVisibleStarsOptions = {
  latitude: number;
  longitude: number;
  date: Date;
  /** Minimum altitude (degrees) to include. Defaults to DEFAULT_USEFUL_ALTITUDE_DEG. Use 0 for "everything above the horizon". */
  minAltitude?: number;
};

/** True when the star is above the mathematical horizon. */
export function isAboveHorizon(altitude: number): boolean {
  return altitude > HORIZON_ALTITUDE_DEG;
}

/** True when the star is high enough to be practical for learning the sky. */
export function isUsefulForLearning(altitude: number, minAltitude = DEFAULT_USEFUL_ALTITUDE_DEG): boolean {
  return altitude > minAltitude;
}

/** Brightest first. Lower apparent magnitude = brighter. Ties broken by id for stable output. */
export function sortByBrightness<T extends { star: Star }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => a.star.apparentMagnitude - b.star.apparentMagnitude || a.star.id.localeCompare(b.star.id),
  );
}

/**
 * Computes altitude/azimuth for every star in `catalog` and returns those above
 * `minAltitude`, brightest first.
 */
export function getVisibleStars(catalog: Star[], options: GetVisibleStarsOptions): VisibleStar[] {
  const { latitude, longitude, date, minAltitude = DEFAULT_USEFUL_ALTITUDE_DEG } = options;
  const observer: Observer = { latitude, longitude };
  const frame = createSkyFrame(observer, date);

  const visible: VisibleStar[] = [];
  for (const star of catalog) {
    const horizontal = toHorizontal(star, frame);
    if (horizontal.altitude > minAltitude) visible.push({ star, horizontal });
  }
  return sortByBrightness(visible);
}

/** Same as getVisibleStars but returns every star, including those below the horizon. */
export function getAllStarPositions(catalog: Star[], observer: Observer, date: Date): VisibleStar[] {
  const frame = createSkyFrame(observer, date);
  return catalog.map((star) => ({ star, horizontal: toHorizontal(star, frame) }));
}
