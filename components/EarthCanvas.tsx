"use client";

import { useEffect, useRef } from "react";
import type { HorizontalCoordinates, Observer } from "@/lib/astronomy/types";
import { isLand, landMask } from "@/lib/chart/earthRaster";
import { type Mat3, apply, directionOf } from "@/lib/chart/view";

type Props = {
  observer: Observer;
  /** The view rotation — same as the chart. */
  view: Mat3;
  /** Where the Sun is, for day and night. */
  sun: HorizontalCoordinates | null;
  /** Planet radius as a fraction of the chart's horizon radius. */
  radiusFraction: number;
  /** Chart margin as a fraction of the SVG size, so the canvas lines up with the SVG disc. */
  insetFraction: number;
  /** True while the sphere is being dragged or coasting: paint at half resolution, refine when it settles. */
  moving: boolean;
};

const DEG = Math.PI / 180;
const FULL = 560; // planet diameter in canvas pixels when still
const LOW = 280; // while moving: a quarter of the pixels, refined on settle

// Palette
const OCEAN = [38, 96, 172];
const LAND = [128, 176, 96];
const NIGHT_OCEAN = [14, 28, 64];
const NIGHT_LAND = [44, 66, 48];
const AMBIENT = 0.22; // how much of the daylight colour survives on the night side

/**
 * The planet, painted per pixel, in two passes:
 *
 *  1. SURFACE — for every pixel in the disc, undo the view (tilt, spin) and the
 *     observer's orientation to find the latitude/longitude under it, and
 *     remember land-or-ocean plus the pixel's outward normal. Expensive (trig
 *     per pixel) but only changes when the planet is dragged or the observer
 *     moves — never while the clock runs.
 *  2. LIGHT — shade each remembered pixel by the Sun's direction. No trig, a
 *     handful of multiplies per pixel, so it can run on every clock tick.
 */
export function EarthCanvas({ observer, view, sun, radiusFraction, insetFraction, moving }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const surface = useRef<Surface | null>(null);
  const image = useRef<ImageData | null>(null);

  // Quantise the Sun so a tiny per-tick drift doesn't force a repaint when nothing visible changed.
  const sunAlt = sun ? Math.round(sun.altitude * 4) / 4 : null;
  const sunAz = sun ? Math.round(sun.azimuth * 4) / 4 : null;

  useEffect(() => {
    const canvas = ref.current;
    const mask = landMask();
    if (!canvas || !mask) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = moving ? LOW : FULL;
    if (canvas.width !== size) {
      canvas.width = size;
      canvas.height = size;
      image.current = null;
    }
    if (!image.current) image.current = ctx.createImageData(size, size);

    const key = `${size}|${observer.latitude},${observer.longitude},${view.map((v) => v.toFixed(5)).join(",")}`;
    if (!surface.current || surface.current.key !== key) surface.current = buildSurface(key, size, observer, view, mask);

    // Sun direction in view space (same forward pipeline as the chart).
    const sunV: [number, number, number] | null = sunAlt !== null && sunAz !== null ? apply(view, directionOf(sunAlt, sunAz)) : null;
    light(surface.current, size, sunV, image.current.data);
    ctx.putImageData(image.current, 0, 0);
  }, [observer, view, sunAlt, sunAz, moving]);

  // Position: the SVG disc is inset by the chart margin; the planet is a fraction of that disc.
  const discInset = insetFraction * 100;
  const discSize = 100 - 2 * insetFraction * 100;
  const planetSize = discSize * radiusFraction;
  const planetInset = discInset + (discSize - planetSize) / 2;
  return (
    <canvas
      ref={ref}
      className="earth-canvas"
      aria-hidden="true"
      style={{ left: `${planetInset}%`, top: `${planetInset}%`, width: `${planetSize}%`, height: `${planetSize}%` }}
    />
  );
}

type Surface = { key: string; land: Uint8Array; nx: Float32Array; ny: Float32Array; nz: Float32Array; edge: Float32Array };

function buildSurface(key: string, SIZE: number, observer: Observer, view: Mat3, mask: Uint8Array): Surface {
  const n = SIZE * SIZE;
  const land = new Uint8Array(n);
  const nx = new Float32Array(n);
  const ny = new Float32Array(n);
  const nz = new Float32Array(n);
  const edge = new Float32Array(n);
  const c = SIZE / 2;
  const R = (SIZE / 2) * 0.985;

  // Inverse view (transpose of a rotation), unrolled for the hot loop.
  const [m0, m1, m2, m3, m4, m5, m6, m7, m8] = view;
  const φ0 = observer.latitude * DEG;
  const λ0 = observer.longitude * DEG;
  const E = [-Math.sin(λ0), Math.cos(λ0), 0];
  const N = [-Math.sin(φ0) * Math.cos(λ0), -Math.sin(φ0) * Math.sin(λ0), Math.cos(φ0)];
  const U = [Math.cos(φ0) * Math.cos(λ0), Math.cos(φ0) * Math.sin(λ0), Math.sin(φ0)];

  for (let j = 0; j < SIZE; j++) {
    const vy = (j + 0.5 - c) / R;
    for (let i = 0; i < SIZE; i++) {
      const vx = (i + 0.5 - c) / R;
      const rr = vx * vx + vy * vy;
      const o = j * SIZE + i;
      if (rr > 1) {
        edge[o] = 0;
        continue;
      }
      const vz = Math.sqrt(1 - rr);
      // Undo the view: chart-frame direction (x = -east, y = -north, z = up).
      const cx = m0 * vx + m3 * vy + m6 * vz;
      const cy = m1 * vx + m4 * vy + m7 * vz;
      const up = m2 * vx + m5 * vy + m8 * vz;
      const east = -cx;
      const north = -cy;
      const ex = east * E[0] + north * N[0] + up * U[0];
      const ey = east * E[1] + north * N[1] + up * U[1];
      const ez = east * E[2] + north * N[2] + up * U[2];
      const lat = Math.asin(ez > 1 ? 1 : ez < -1 ? -1 : ez) / DEG;
      const lon = Math.atan2(ey, ex) / DEG;
      land[o] = isLand(mask, lat, lon);
      nx[o] = vx;
      ny[o] = vy;
      nz[o] = vz;
      edge[o] = Math.min(1, (1 - Math.sqrt(rr)) * R * 1.2);
    }
  }
  return { key, land, nx, ny, nz, edge };
}

function light(s: Surface, SIZE: number, sunV: [number, number, number] | null, px: Uint8ClampedArray) {
  const n = SIZE * SIZE;
  const sx = sunV ? sunV[0] : 0;
  const sy = sunV ? sunV[1] : 0;
  const sz = sunV ? sunV[2] : 1;
  // Half-vector for the water glint.
  const hl = Math.hypot(sx, sy, sz + 1) || 1;
  const hx = sx / hl;
  const hy = sy / hl;
  const hz = (sz + 1) / hl;
  for (let o = 0; o < n; o++) {
    const e = s.edge[o];
    const p = o * 4;
    if (e === 0) {
      px[p + 3] = 0;
      continue;
    }
    const vx = s.nx[o];
    const vy = s.ny[o];
    const vz = s.nz[o];
    const lambert = vx * sx + vy * sy + vz * sz;
    let day = lambert * 2.2 + 0.1;
    day = day < 0 ? 0 : day > 1 ? 1 : day;
    const limb = 0.6 + 0.4 * vz;
    const k = (AMBIENT + (1 - AMBIENT) * day) * limb;
    const isL = s.land[o];
    const d = isL ? LAND : OCEAN;
    const nn = isL ? NIGHT_LAND : NIGHT_OCEAN;
    let rC = nn[0] + (d[0] - nn[0]) * k;
    let gC = nn[1] + (d[1] - nn[1]) * k;
    let bC = nn[2] + (d[2] - nn[2]) * k;
    if (!isL) {
      const h = vx * hx + vy * hy + vz * hz;
      if (h > 0.9) {
        const spec = Math.pow(h, 48) * 140 * day;
        rC += spec;
        gC += spec;
        bC += spec * 0.9;
      }
    }
    px[p] = rC;
    px[p + 1] = gC;
    px[p + 2] = bC;
    px[p + 3] = 255 * e;
  }
}
