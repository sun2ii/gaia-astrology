import { describe, expect, it } from "vitest";
import { createSkyFrame, toHorizontal } from "@/lib/astronomy/coordinates";
import {
  DEFAULT_USEFUL_ALTITUDE_DEG,
  getAllStarPositions,
  getVisibleStars,
  isAboveHorizon,
  isUsefulForLearning,
  sortByBrightness,
} from "@/lib/astronomy/visibility";
import { STARS } from "@/lib/catalog/stars";
import { DEFAULT_OBSERVER } from "@/lib/config/observer";

const date = new Date("2026-09-04T04:30:00Z"); // 2026-09-03 21:30 Pacific

describe("getVisibleStars", () => {
  it("excludes every star below the horizon", () => {
    const visible = getVisibleStars(STARS, { ...DEFAULT_OBSERVER, date, minAltitude: 0 });
    for (const v of visible) expect(v.horizontal.altitude).toBeGreaterThan(0);

    // ...and includes every star above it: compare with a brute-force pass.
    const frame = createSkyFrame(DEFAULT_OBSERVER, date);
    const expected = STARS.filter((s) => toHorizontal(s, frame).altitude > 0).length;
    expect(visible.length).toBe(expected);
  });

  it("shows roughly half the sky from mid-latitudes (never all, never none)", () => {
    const visible = getVisibleStars(STARS, { ...DEFAULT_OBSERVER, date, minAltitude: 0 });
    expect(visible.length).toBeGreaterThan(STARS.length * 0.25);
    expect(visible.length).toBeLessThan(STARS.length * 0.75);
  });

  it("applies the configurable minimum altitude", () => {
    const all = getVisibleStars(STARS, { ...DEFAULT_OBSERVER, date, minAltitude: 0 });
    const useful = getVisibleStars(STARS, { ...DEFAULT_OBSERVER, date });
    const high = getVisibleStars(STARS, { ...DEFAULT_OBSERVER, date, minAltitude: 45 });
    expect(useful.length).toBeLessThan(all.length);
    expect(high.length).toBeLessThan(useful.length);
    for (const v of useful) expect(v.horizontal.altitude).toBeGreaterThan(DEFAULT_USEFUL_ALTITUDE_DEG);
    for (const v of high) expect(v.horizontal.altitude).toBeGreaterThan(45);
  });

  it("sorts brightest first (lower magnitude first)", () => {
    const visible = getVisibleStars(STARS, { ...DEFAULT_OBSERVER, date });
    for (let i = 1; i < visible.length; i++) {
      expect(visible[i].star.apparentMagnitude).toBeGreaterThanOrEqual(visible[i - 1].star.apparentMagnitude);
    }
  });

  it("never returns a star that is not in the catalog, and never twice", () => {
    const visible = getVisibleStars(STARS, { ...DEFAULT_OBSERVER, date, minAltitude: 0 });
    const ids = new Set(visible.map((v) => v.star.id));
    expect(ids.size).toBe(visible.length);
  });
});

describe("helpers", () => {
  it("isAboveHorizon / isUsefulForLearning use strict thresholds", () => {
    expect(isAboveHorizon(0.01)).toBe(true);
    expect(isAboveHorizon(0)).toBe(false);
    expect(isAboveHorizon(-5)).toBe(false);
    expect(isUsefulForLearning(10.01)).toBe(true);
    expect(isUsefulForLearning(10)).toBe(false);
    expect(isUsefulForLearning(5, 3)).toBe(true);
  });

  it("sortByBrightness puts Sirius (−1.44) before Vega (0.03) before Polaris (1.97)", () => {
    const pick = (name: string) => STARS.find((s) => s.name === name)!;
    const items = [pick("Polaris"), pick("Vega"), pick("Sirius")].map((star) => ({ star }));
    const sorted = sortByBrightness(items).map((i) => i.star.name);
    expect(sorted).toEqual(["Sirius", "Vega", "Polaris"]);
  });

  it("getAllStarPositions returns one entry per catalog star", () => {
    expect(getAllStarPositions(STARS, DEFAULT_OBSERVER, date)).toHaveLength(STARS.length);
  });
});
