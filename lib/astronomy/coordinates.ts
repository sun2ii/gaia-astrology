/**
 * RA/Dec  ->  altitude/azimuth  for an observer on Earth at a given instant.
 *
 * This is the ONLY file that talks to the astronomy library. Everything else in
 * the app goes through getHorizontalCoordinates(), so the library can be swapped
 * later without touching application code.
 *
 * Library: astronomy-engine (https://github.com/cosinekitty/astronomy)
 *   - zero dependencies, ~100 KB, MIT licensed, TypeScript types included
 *   - validated against JPL Horizons; handles precession, nutation, sidereal
 *     time and Earth orientation so we don't have to
 *   - supports converting J2000 equatorial coordinates directly into the
 *     horizontal frame, which is exactly what a J2000 star catalog needs
 *
 * How the conversion works (plain-English version)
 * ------------------------------------------------
 * A star's RA/Dec is like a fixed "address" on the celestial sphere. Where that
 * address appears in *your* sky depends on (1) where you stand — your latitude
 * tilts the sky, your longitude shifts it — and (2) the time, because the Earth
 * rotates once per sidereal day (~23h56m), sweeping the whole sky westward.
 * The library builds a rotation matrix from the J2000 equatorial frame to the
 * observer's local horizon frame for that instant, applies it to the star's
 * direction vector, and reads off altitude and azimuth.
 */
import {
  CombineRotation,
  HorizonFromVector,
  Observer as EngineObserver,
  RotateVector,
  Rotation_ECT_EQD,
  Rotation_EQD_HOR,
  Rotation_EQJ_HOR,
  Spherical,
  VectorFromSphere,
  type RotationMatrix,
} from "astronomy-engine";
import type { HorizontalCoordinates, Observer, Star } from "./types";

/** Position on the celestial sphere, ICRS/J2000, in decimal degrees. */
export type EquatorialPosition = Pick<Star, "ra" | "dec">;

/**
 * A reusable J2000 -> horizon rotation for one observer at one instant.
 * Building it once and applying it to all 500 stars is much cheaper than
 * recomputing Earth orientation per star.
 */
export type SkyFrame = {
  observer: Observer;
  date: Date;
  rotation: RotationMatrix;
};

export function createSkyFrame(observer: Observer, date: Date): SkyFrame {
  validateObserver(observer);
  // astronomy-engine wants (latitude, longitude, height in metres). Height only
  // matters for parallax on nearby solar-system bodies, so sea level is fine.
  const engineObserver = new EngineObserver(observer.latitude, observer.longitude, 0);
  return { observer, date, rotation: Rotation_EQJ_HOR(date, engineObserver) };
}

/**
 * Converts a J2000 RA/Dec (degrees) into altitude/azimuth (degrees) for the frame.
 *
 * Refraction is deliberately NOT applied in V1 (geometric position only).
 */
export function toHorizontal(position: EquatorialPosition, frame: SkyFrame): HorizontalCoordinates {
  // Spherical(lat, lon, dist): lat = Dec, lon = RA in degrees; distance is
  // irrelevant for direction so we use 1 AU.
  const sphere = new Spherical(position.dec, position.ra, 1);
  const equatorialVector = VectorFromSphere(sphere, frame.date);
  const horizonVector = RotateVector(frame.rotation, equatorialVector);
  // refraction = null -> no atmospheric refraction correction.
  const horizontal = HorizonFromVector(horizonVector, null as unknown as string);
  return {
    altitude: horizontal.lat, // -90..+90
    azimuth: normalizeAzimuth(horizontal.lon), // 0..360, N=0, E=90
  };
}

/** Convenience wrapper for a single star. Prefer createSkyFrame + toHorizontal in loops. */
export function getHorizontalCoordinates(star: EquatorialPosition, observer: Observer, date: Date): HorizontalCoordinates {
  return toHorizontal(star, createSkyFrame(observer, date));
}

export function normalizeAzimuth(azimuth: number): number {
  const a = ((azimuth % 360) + 360) % 360;
  return a === 360 ? 0 : a;
}

export function validateObserver(observer: Observer): void {
  const { latitude, longitude } = observer;
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new RangeError(`latitude must be between -90 and 90, got ${latitude}`);
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new RangeError(`longitude must be between -180 and 180, got ${longitude}`);
  }
}

/* ---------- Ecliptic of date -> horizontal (for drawing the zodiac band) ---------- */

/**
 * Rotation from true ecliptic of date (ECT) straight to the observer's horizon
 * frame. Used to draw the ecliptic — the road the Sun, Moon and planets travel —
 * and the twelve 30° zodiac slices along it.
 */
export function createEclipticFrame(observer: Observer, date: Date): SkyFrame {
  validateObserver(observer);
  const engineObserver = new EngineObserver(observer.latitude, observer.longitude, 0);
  const rotation = CombineRotation(Rotation_ECT_EQD(date), Rotation_EQD_HOR(date, engineObserver));
  return { observer, date, rotation };
}

/** Ecliptic longitude/latitude of date (degrees) -> altitude/azimuth. */
export function eclipticToHorizontal(longitude: number, latitude: number, frame: SkyFrame): HorizontalCoordinates {
  const vector = VectorFromSphere(new Spherical(latitude, longitude, 1), frame.date);
  const horizontal = HorizonFromVector(RotateVector(frame.rotation, vector), null as unknown as string);
  return { altitude: horizontal.lat, azimuth: normalizeAzimuth(horizontal.lon) };
}
