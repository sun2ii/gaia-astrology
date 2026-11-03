import { describe, expect, it } from "vitest";
import { earthOutlines, earthPointToHorizontal } from "@/lib/chart/earth";
import { DEFAULT_OBSERVER } from "@/lib/config/observer";

describe("little Earth orientation", () => {
  it("puts the observer's own location at the zenith", () => {
    const h = earthPointToHorizontal(DEFAULT_OBSERVER.latitude, DEFAULT_OBSERVER.longitude, DEFAULT_OBSERVER);
    expect(h.altitude).toBeCloseTo(90, 5);
  });

  it("points the north pole at the celestial pole: altitude = latitude, due north", () => {
    const h = earthPointToHorizontal(90, 0, DEFAULT_OBSERVER);
    expect(h.altitude).toBeCloseTo(DEFAULT_OBSERVER.latitude, 6);
    expect(h.azimuth % 360).toBeCloseTo(0, 6);
  });

  it("puts the antipode straight down", () => {
    const h = earthPointToHorizontal(-DEFAULT_OBSERVER.latitude, DEFAULT_OBSERVER.longitude + 180, DEFAULT_OBSERVER);
    expect(h.altitude).toBeCloseTo(-90, 5);
  });

  it("a point due east of the observer on the equator-ish circle sits at azimuth 90", () => {
    // Same latitude, 90° further east: lies on the observer's east–west great circle only on the equator,
    // so use the equator for a clean check.
    const eq = { latitude: 0, longitude: 0 };
    expect(earthPointToHorizontal(0, 90, eq).azimuth).toBeCloseTo(90, 6);
    expect(earthPointToHorizontal(0, 90, eq).altitude).toBeCloseTo(0, 6);
  });

  it("loads every outline", () => {
    const rings = earthOutlines(DEFAULT_OBSERVER);
    expect(rings.length).toBeGreaterThan(100);
    expect(rings.reduce((n, r) => n + r.length, 0)).toBeGreaterThan(5000);
  });
});
