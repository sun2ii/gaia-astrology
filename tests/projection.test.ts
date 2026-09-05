import { describe, expect, it } from "vitest";
import { projectToDome, starDotRadius, unprojectFromDome } from "@/lib/astronomy/projection";

const R = 300;

describe("projectToDome (look-up chart)", () => {
  it("puts the zenith at the centre and the horizon on the rim", () => {
    const zenith = projectToDome({ altitude: 90, azimuth: 123 }, R);
    expect(Math.hypot(zenith.x, zenith.y)).toBeCloseTo(0, 6);
    const horizon = projectToDome({ altitude: 0, azimuth: 45 }, R);
    expect(Math.hypot(horizon.x, horizon.y)).toBeCloseTo(R, 6);
  });

  it("puts north at the top, south at the bottom, and EAST ON THE LEFT (looking up, not down)", () => {
    const n = projectToDome({ altitude: 0, azimuth: 0 }, R);
    const e = projectToDome({ altitude: 0, azimuth: 90 }, R);
    const s = projectToDome({ altitude: 0, azimuth: 180 }, R);
    const w = projectToDome({ altitude: 0, azimuth: 270 }, R);
    expect(n.y).toBeCloseTo(-R); // SVG y grows downward, so "up" is negative
    expect(n.x).toBeCloseTo(0);
    expect(s.y).toBeCloseTo(R);
    expect(e.x).toBeCloseTo(-R);
    expect(w.x).toBeCloseTo(R);
  });

  it("spaces altitude evenly: 45° is exactly halfway from centre to rim", () => {
    const p = projectToDome({ altitude: 45, azimuth: 200 }, R);
    expect(Math.hypot(p.x, p.y)).toBeCloseTo(R / 2, 6);
  });

  it("projects below-horizon points beyond the rim so lines can be clipped there", () => {
    const p = projectToDome({ altitude: -9, azimuth: 10 }, R);
    expect(Math.hypot(p.x, p.y)).toBeCloseTo(R * 1.1, 6);
  });

  it("round-trips through unprojectFromDome", () => {
    for (const h of [
      { altitude: 10, azimuth: 0 },
      { altitude: 63, azimuth: 282 },
      { altitude: 0.5, azimuth: 359.5 },
      { altitude: 89, azimuth: 45 },
    ]) {
      const back = unprojectFromDome(projectToDome(h, R), R);
      expect(back.altitude).toBeCloseTo(h.altitude, 6);
      expect(back.azimuth).toBeCloseTo(h.azimuth, 6);
    }
  });
});

describe("starDotRadius", () => {
  it("makes brighter stars bigger and never returns a non-positive radius", () => {
    expect(starDotRadius(-1.44, R)).toBeGreaterThan(starDotRadius(0, R));
    expect(starDotRadius(0, R)).toBeGreaterThan(starDotRadius(2, R));
    expect(starDotRadius(2, R)).toBeGreaterThan(starDotRadius(4, R));
    expect(starDotRadius(6.6, R)).toBeGreaterThan(0);
  });
});
