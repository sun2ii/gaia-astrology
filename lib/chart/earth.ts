import earthJson from "@/data/earth.json";
import type { HorizontalCoordinates, Observer } from "@/lib/astronomy/types";

/**
 * The little Earth at the centre of the sky sphere.
 *
 * The chart frame is the observer's horizontal frame (altitude/azimuth). In
 * that frame the ground does not move, so the Earth only depends on where the
 * observer stands: their location is straight up (the zenith) and the planet's
 * axis points at the celestial pole — altitude = latitude, due north. Every
 * land outline is expressed as a *direction* from the Earth's centre in that
 * frame, which lets the chart project it with the same spin/tilt as the stars.
 */

type Ring = number[][];
const RINGS = (earthJson as { rings: Ring[] }).rings;

const DEG = Math.PI / 180;

/** Direction of a geographic point from the Earth's centre, as alt/az in the observer's frame. */
export function earthPointToHorizontal(latitude: number, longitude: number, observer: Observer): HorizontalCoordinates {
  const φ = latitude * DEG;
  const λ = longitude * DEG;
  const φ0 = observer.latitude * DEG;
  const λ0 = observer.longitude * DEG;
  // Earth-fixed unit vector of the point.
  const px = Math.cos(φ) * Math.cos(λ);
  const py = Math.cos(φ) * Math.sin(λ);
  const pz = Math.sin(φ);
  // Observer's local east / north / up, in the same Earth-fixed frame.
  const e = -px * Math.sin(λ0) + py * Math.cos(λ0);
  const n = -px * Math.sin(φ0) * Math.cos(λ0) - py * Math.sin(φ0) * Math.sin(λ0) + pz * Math.cos(φ0);
  const u = px * Math.cos(φ0) * Math.cos(λ0) + py * Math.cos(φ0) * Math.sin(λ0) + pz * Math.sin(φ0);
  const altitude = Math.asin(Math.max(-1, Math.min(1, u))) / DEG;
  const azimuth = ((Math.atan2(e, n) / DEG) % 360 + 360) % 360;
  return { altitude, azimuth };
}

/** Every land outline as directions in the observer's frame. Compute once per observer. */
export function earthOutlines(observer: Observer): HorizontalCoordinates[][] {
  return RINGS.map((ring) => ring.map(([lon, lat]) => earthPointToHorizontal(lat, lon, observer)));
}

/** Where the Earth's north pole points: the same direction as the celestial pole. */
export function earthAxis(observer: Observer): { north: HorizontalCoordinates; south: HorizontalCoordinates } {
  return {
    north: { altitude: observer.latitude, azimuth: 0 },
    south: { altitude: -observer.latitude, azimuth: 180 },
  };
}

/** Unit vector for an alt/az direction (east, north, up). */
export function horizontalToVector(h: HorizontalCoordinates): [number, number, number] {
  const alt = h.altitude * DEG;
  const az = h.azimuth * DEG;
  return [Math.cos(alt) * Math.sin(az), Math.cos(alt) * Math.cos(az), Math.sin(alt)];
}

/** Continent and ocean names, placed at a representative point. Orientation only. */
export const EARTH_LABELS: Array<{ name: string; latitude: number; longitude: number; kind: "land" | "ocean" }> = [
  { name: "North America", latitude: 45, longitude: -100, kind: "land" },
  { name: "South America", latitude: -15, longitude: -60, kind: "land" },
  { name: "Europe", latitude: 50, longitude: 15, kind: "land" },
  { name: "Africa", latitude: 5, longitude: 20, kind: "land" },
  { name: "Asia", latitude: 45, longitude: 90, kind: "land" },
  { name: "Australia", latitude: -25, longitude: 134, kind: "land" },
  { name: "Antarctica", latitude: -80, longitude: 0, kind: "land" },
  { name: "Pacific Ocean", latitude: 0, longitude: -150, kind: "ocean" },
  { name: "Atlantic Ocean", latitude: 20, longitude: -40, kind: "ocean" },
  { name: "Indian Ocean", latitude: -20, longitude: 80, kind: "ocean" },
  { name: "Southern Ocean", latitude: -62, longitude: 120, kind: "ocean" },
  { name: "Arctic Ocean", latitude: 85, longitude: 120, kind: "ocean" },
];

/** Lines of latitude worth drawing: equator, tropics, polar circles. */
export const EARTH_PARALLELS: Array<{ latitude: number; name: string }> = [
  { latitude: 66.56, name: "Arctic Circle" },
  { latitude: 23.44, name: "Tropic of Cancer" },
  { latitude: 0, name: "Equator" },
  { latitude: -23.44, name: "Tropic of Capricorn" },
  { latitude: -66.56, name: "Antarctic Circle" },
];

/** A parallel as directions in the observer's frame. */
export function earthParallel(latitude: number, observer: Observer): HorizontalCoordinates[] {
  return Array.from({ length: 73 }, (_, i) => earthPointToHorizontal(latitude, i * 5 - 180, observer));
}

/** A meridian (pole to pole) as directions in the observer's frame. */
export function earthMeridian(longitude: number, observer: Observer): HorizontalCoordinates[] {
  return Array.from({ length: 37 }, (_, i) => earthPointToHorizontal(i * 5 - 90, longitude, observer));
}
