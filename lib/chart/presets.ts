import { type SkyFrame, createEclipticFrame, eclipticToHorizontal, toHorizontal } from "@/lib/astronomy/coordinates";
import type { BodyPosition } from "@/lib/astronomy/solarSystem";
import type { HorizontalCoordinates, Observer } from "@/lib/astronomy/types";
import { IDENTITY, type Mat3, type Vec3, apply, axisAngle, directionOf, multiply, orthonormalize } from "@/lib/chart/view";

/**
 * Named viewpoints. Each one is a rule for building the view rotation:
 * "put this direction at the centre, with that direction as up". The
 * following ones re-run the rule every clock tick so the target stays put
 * while the sky slides past; the static ones run once when chosen.
 */
export type ViewMode =
  | "overhead" // looking straight up, north at the top (the default)
  | "pole" // the celestial pole at the centre: the sky wheels around it
  | "equator" // the celestial equator across the middle, facing south
  | "zodiac" // the ecliptic as a horizontal ribbon through the Sun (follows)
  | "sun" // Earth as seen from the Sun (follows)
  | "followSun" // the Sun pinned at the centre, your up stays up (follows)
  | "followMoon" // the Moon pinned at the centre (follows)
  | "space" // fixed to the stars: the Earth turns under a still sky (follows)
  | "free"; // the user has dragged; nothing is enforced

export const VIEW_MODES: Array<{ mode: Exclude<ViewMode, "free">; label: string; hint: string; follows: boolean; locked: boolean }> = [
  { mode: "overhead", label: "Pin", hint: "Straight up from where you stand, north at the top", follows: false, locked: false },
  { mode: "followSun", label: "Follow Sun", hint: "The Sun stays put; the stars drift behind it", follows: true, locked: false },
  { mode: "equator", label: "Lock Equator", hint: "Facing south along the celestial equator — drag slides along it", follows: false, locked: true },
  { mode: "zodiac", label: "Zodiac View", hint: "Only the zodiac, fixed to the stars — drag slides along the signs", follows: true, locked: true },
];

/** Locked modes: dragging only slides along the band (a turn about the screen's up axis). */
export function lockedToBand(mode: ViewMode): boolean {
  return VIEW_MODES.find((m) => m.mode === mode)?.locked ?? false;
}

export function followsTime(mode: ViewMode): boolean {
  return VIEW_MODES.find((m) => m.mode === mode)?.follows ?? false;
}

/** Screen-up axis in view space; locked modes keep their band's pole here. */
export const SCREEN_UP: Vec3 = [0, -1, 0];

/** The angle (radians) of a turn about screen-up that carries `base` to `view`. */
export function bandOffset(base: Mat3, view: Mat3): number {
  // R = view · baseᵀ is a rotation about screen-up: R[0] = cos, R[2] = ±sin.
  const bt: Mat3 = [base[0], base[3], base[6], base[1], base[4], base[7], base[2], base[5], base[8]];
  const r = multiply(view, bt);
  return Math.atan2(r[2], r[0]);
}

/** Apply a band offset: a turn about screen-up on top of the base view. */
export function withBandOffset(base: Mat3, offset: number): Mat3 {
  return multiply(axisAngle(SCREEN_UP, offsetSign * offset), base);
}

// axisAngle about SCREEN_UP gives R[2] = sin(θ)·(axis sign); fix the sign once so bandOffset/withBandOffset round-trip.
const offsetSign = (() => {
  const m = axisAngle(SCREEN_UP, 0.3);
  return Math.atan2(m[2], m[0]) > 0 ? 1 : -1;
})();

/** A rotation that puts `center` facing the viewer and `up` towards the top of the screen. */
export function lookAt(center: Vec3, up: Vec3): Mat3 {
  const z = normalize(center);
  const d = up[0] * z[0] + up[1] * z[1] + up[2] * z[2];
  let u: Vec3 = [up[0] - d * z[0], up[1] - d * z[1], up[2] - d * z[2]];
  if (Math.hypot(...u) < 1e-6) u = Math.abs(z[2]) < 0.9 ? [0, 0, 1] : [0, -1, 0];
  u = normalize(u);
  const y: Vec3 = [-u[0], -u[1], -u[2]]; // screen y grows downward
  const x: Vec3 = [y[1] * z[2] - y[2] * z[1], y[2] * z[0] - y[0] * z[2], y[0] * z[1] - y[1] * z[0]];
  return [x[0], x[1], x[2], y[0], y[1], y[2], z[0], z[1], z[2]];
}

function normalize(v: Vec3): Vec3 {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

const dir = (h: HorizontalCoordinates) => directionOf(h.altitude, h.azimuth);
const ZENITH: Vec3 = [0, 0, 1];

/** J2000 reference directions, expressed in the observer's frame for this instant. */
function celestialBasis(frame: SkyFrame): Mat3 {
  const e1 = dir(toHorizontal({ ra: 0, dec: 0 }, frame));
  const e2 = dir(toHorizontal({ ra: 90, dec: 0 }, frame));
  const e3 = dir(toHorizontal({ ra: 0, dec: 90 }, frame));
  // Columns are the images of the celestial axes: R maps celestial -> chart frame.
  return [e1[0], e2[0], e3[0], e1[1], e2[1], e3[1], e1[2], e2[2], e3[2]];
}

function transpose(m: Mat3): Mat3 {
  return [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
}

export type SpaceAnchor = Mat3; // view · R(t0): the stars' fixed orientation on screen

export function spaceAnchor(view: Mat3, frame: SkyFrame): SpaceAnchor {
  return multiply(view, celestialBasis(frame));
}

type Context = {
  observer: Observer;
  frame: SkyFrame;
  bodies: BodyPosition[];
  /** Only for "space": the stars' fixed on-screen orientation. */
  anchor?: SpaceAnchor;
  /** Only for "zodiac": the ecliptic longitude at the centre (set to the Sun's when the view is chosen). */
  zodiacLongitude?: number;
};

/** The view rotation for a mode right now, or null if the mode has nothing to enforce. */
export function viewFor(mode: ViewMode, ctx: Context): Mat3 | null {
  const { observer, frame, bodies } = ctx;
  const pole = directionOf(observer.latitude, 0); // celestial north pole: altitude = latitude, due north
  const body = (id: string) => bodies.find((b) => b.id === id);
  switch (mode) {
    case "overhead":
      return IDENTITY;
    case "pole":
      return lookAt(pole, ZENITH);
    case "equator":
      // The point of the celestial equator due south, with the pole as up.
      return lookAt(directionOf(90 - observer.latitude, 180), pole);
    case "zodiac": {
      // Fixed to the stars: the band and its signs stay put while the Earth turns beneath.
      const λ = ctx.zodiacLongitude ?? body("sun")?.eclipticLongitude;
      if (λ === undefined) return null;
      const centre = dir(eclipticToHorizontal(λ, 0, createEclipticFrame(observer, frame.date)));
      const eclipticPole = dir(toHorizontal({ ra: 270, dec: 66.56 }, frame));
      return lookAt(centre, eclipticPole);
    }
    case "sun": {
      const sun = body("sun");
      if (!sun) return null;
      // The sub-solar point faces the viewer; Earth's axis is up.
      return lookAt(dir(sun.horizontal), pole);
    }
    case "followSun": {
      const sun = body("sun");
      return sun ? lookAt(dir(sun.horizontal), ZENITH) : null;
    }
    case "followMoon": {
      const moon = body("moon");
      return moon ? lookAt(dir(moon.horizontal), ZENITH) : null;
    }
    case "space":
      return ctx.anchor ? orthonormalize(multiply(ctx.anchor, transpose(celestialBasis(frame)))) : null;
    case "free":
      return null;
  }
}

/** Sanity helper for tests: where a direction ends up on screen under a view. */
export function screenOf(view: Mat3, h: HorizontalCoordinates): Vec3 {
  return apply(view, dir(h));
}
