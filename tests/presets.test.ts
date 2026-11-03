import { describe, expect, it } from "vitest";
import { createSkyFrame, toHorizontal } from "@/lib/astronomy/coordinates";
import { getSolarSystemPositions } from "@/lib/astronomy/solarSystem";
import { bandOffset, lookAt, screenOf, spaceAnchor, viewFor, withBandOffset } from "@/lib/chart/presets";
import { IDENTITY, apply, directionOf } from "@/lib/chart/view";
import { DEFAULT_OBSERVER } from "@/lib/config/observer";

const date = new Date("2026-09-04T04:30:00Z");
const frame = createSkyFrame(DEFAULT_OBSERVER, date);
const bodies = getSolarSystemPositions(DEFAULT_OBSERVER, date);
const ctx = { observer: DEFAULT_OBSERVER, frame, bodies };

describe("view presets", () => {
  it("lookAt puts the centre facing the viewer and up at the top", () => {
    const m = lookAt(directionOf(30, 120), [0, 0, 1]);
    const c = apply(m, directionOf(30, 120));
    expect(c[2]).toBeCloseTo(1, 9);
    const up = apply(m, [0, 0, 1]);
    expect(up[1]).toBeLessThan(0); // screen y grows downward, so "up" is negative
    expect(Math.abs(up[0])).toBeLessThan(1e-9);
  });

  it("the pole view centres the celestial pole", () => {
    const v = viewFor("pole", ctx)!;
    const polaris = screenOf(v, toHorizontal({ ra: 37.95, dec: 89.26 }, frame));
    expect(polaris[2]).toBeGreaterThan(0.999);
  });

  it("the equator view lays the celestial equator across the middle", () => {
    const v = viewFor("equator", ctx)!;
    for (const ra of [0, 60, 120, 180, 240, 300]) {
      const p = screenOf(v, toHorizontal({ ra, dec: 0 }, frame));
      if (p[2] > 0) expect(Math.abs(p[1])).toBeLessThan(0.01); // J2000 equator vs equator of date: ~0.3° of precession
    }
  });

  it("from the Sun, the Sun faces the viewer", () => {
    const v = viewFor("sun", ctx)!;
    const sun = bodies.find((b) => b.id === "sun")!;
    expect(screenOf(v, sun.horizontal)[2]).toBeCloseTo(1, 9);
  });

  it("the space view keeps a star on the same screen spot as time passes", () => {
    const anchor = spaceAnchor(IDENTITY, frame);
    const star = { ra: 279.23, dec: 38.78 }; // Vega
    const a = screenOf(viewFor("space", { ...ctx, anchor })!, toHorizontal(star, frame));
    const later = new Date(date.getTime() + 3 * 3600 * 1000);
    const frame2 = createSkyFrame(DEFAULT_OBSERVER, later);
    const b = screenOf(viewFor("space", { ...ctx, frame: frame2, anchor })!, toHorizontal(star, frame2));
    for (let i = 0; i < 3; i++) expect(b[i]).toBeCloseTo(a[i], 3);
  });

  it("a band offset round-trips and keeps the band horizontal", () => {
    const base = viewFor("equator", ctx)!;
    const v = withBandOffset(base, 0.7);
    expect(bandOffset(base, v)).toBeCloseTo(0.7, 9);
    for (const ra of [0, 90, 180, 270]) {
      const p = screenOf(v, toHorizontal({ ra, dec: 0 }, frame));
      if (p[2] > 0) expect(Math.abs(p[1])).toBeLessThan(0.01);
    }
  });
});
