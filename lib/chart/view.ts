/**
 * The view: a 3×3 rotation applied to every direction before projection.
 * Row-major. Identity = looking straight up with north at the top.
 *
 * The chart frame is (x = -east, y = -north, z = up) — SVG y grows downward,
 * and east is on the left because you are looking up, not down at a map.
 */
export type Mat3 = [number, number, number, number, number, number, number, number, number];
export type Vec3 = [number, number, number];

export const IDENTITY: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];

export function apply(m: Mat3, v: Vec3): Vec3 {
  return [
    m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
    m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
  ];
}

/** Transpose = inverse, for a rotation. */
export function applyInverse(m: Mat3, v: Vec3): Vec3 {
  return [
    m[0] * v[0] + m[3] * v[1] + m[6] * v[2],
    m[1] * v[0] + m[4] * v[1] + m[7] * v[2],
    m[2] * v[0] + m[5] * v[1] + m[8] * v[2],
  ];
}

export function multiply(a: Mat3, b: Mat3): Mat3 {
  const r = new Array(9) as Mat3;
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) r[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
  return r;
}

/** Rotation of `angle` radians about a unit axis (Rodrigues). */
export function axisAngle(axis: Vec3, angle: number): Mat3 {
  const [x, y, z] = axis;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const t = 1 - c;
  return [
    t * x * x + c, t * x * y - s * z, t * x * z + s * y,
    t * x * y + s * z, t * y * y + c, t * y * z - s * x,
    t * x * z - s * y, t * y * z + s * x, t * z * z + c,
  ];
}

export function isIdentity(m: Mat3, eps = 1e-6): boolean {
  return IDENTITY.every((v, i) => Math.abs(m[i] - v) < eps);
}

/** Re-orthonormalise after many small multiplications so the view never shears. */
export function orthonormalize(m: Mat3): Mat3 {
  let r0: Vec3 = [m[0], m[1], m[2]];
  let r1: Vec3 = [m[3], m[4], m[5]];
  const norm = (v: Vec3): Vec3 => {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  };
  r0 = norm(r0);
  const d = r0[0] * r1[0] + r0[1] * r1[1] + r0[2] * r1[2];
  r1 = norm([r1[0] - d * r0[0], r1[1] - d * r0[1], r1[2] - d * r0[2]]);
  const r2: Vec3 = [r0[1] * r1[2] - r0[2] * r1[1], r0[2] * r1[0] - r0[0] * r1[2], r0[0] * r1[1] - r0[1] * r1[0]];
  return [...r0, ...r1, ...r2] as Mat3;
}

/** Unit vector for an alt/az direction in the chart frame (x = -east, y = -north, z = up). */
export function directionOf(altitudeDeg: number, azimuthDeg: number): Vec3 {
  const alt = (altitudeDeg * Math.PI) / 180;
  const az = (azimuthDeg * Math.PI) / 180;
  const ca = Math.cos(alt);
  return [-ca * Math.sin(az), -ca * Math.cos(az), Math.sin(alt)];
}

/**
 * Arcball: the point on the unit sphere under a pointer at (x, y) in units of
 * the sphere radius. Outside the disc the pointer slides along the rim.
 */
export function arcballPoint(x: number, y: number): Vec3 {
  const r2 = x * x + y * y;
  if (r2 <= 1) return [x, y, Math.sqrt(1 - r2)];
  const l = Math.sqrt(r2);
  return [x / l, y / l, 0];
}

/** The rotation that carries sphere point `a` to sphere point `b`, as axis + angle. */
export function rotationBetween(a: Vec3, b: Vec3): { axis: Vec3; angle: number } | null {
  const ax = a[1] * b[2] - a[2] * b[1];
  const ay = a[2] * b[0] - a[0] * b[2];
  const az = a[0] * b[1] - a[1] * b[0];
  const l = Math.hypot(ax, ay, az);
  if (l < 1e-9) return null;
  const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  return { axis: [ax / l, ay / l, az / l], angle: Math.acos(dot) };
}

/** Screen heading of north, in degrees clockwise from up, for the compass key. */
export function northHeadingDeg(m: Mat3): number {
  const n = apply(m, [0, -1, 0]);
  return (Math.atan2(n[0], -n[1]) * 180) / Math.PI;
}
