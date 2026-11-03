import { it, expect } from "vitest";
import { getSolarSystemPositions } from "@/lib/astronomy/solarSystem";
import { earthPointToHorizontal } from "@/lib/chart/earth";
import { DEFAULT_OBSERVER } from "@/lib/config/observer";
import { directionOf } from "@/lib/chart/view";

it("subsolar point", () => {
  const date = new Date("2026-11-03T19:45:00Z");
  const sun = getSolarSystemPositions(DEFAULT_OBSERVER, date).find((b) => b.id === "sun")!;
  const s = directionOf(sun.horizontal.altitude, sun.horizontal.azimuth);
  // brute-force the Earth point whose outward direction matches the Sun
  let best = { lat: 0, lon: 0, d: -2 };
  for (let lat = -90; lat <= 90; lat += 1)
    for (let lon = -180; lon < 180; lon += 1) {
      const h = earthPointToHorizontal(lat, lon, DEFAULT_OBSERVER);
      const v = directionOf(h.altitude, h.azimuth);
      const d = v[0] * s[0] + v[1] * s[1] + v[2] * s[2];
      if (d > best.d) best = { lat, lon, d };
    }
  console.log("sun alt/az", sun.horizontal, "subsolar via our mapping", best, "expected lon ≈ -116, lat ≈ -15");
  expect(Math.abs(best.lon - -116)).toBeLessThan(4);
});
