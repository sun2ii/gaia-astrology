import { describe, expect, it } from "vitest";
import { createEclipticFrame, eclipticToHorizontal } from "@/lib/astronomy/coordinates";
import { getBodyPosition } from "@/lib/astronomy/solarSystem";
import { SIGN_CONSTELLATION, ZODIAC_CONSTELLATIONS, computeZodiacSky } from "@/lib/astrology/zodiacSky";
import { CONSTELLATIONS } from "@/lib/astronomy/constellations";
import { DEFAULT_OBSERVER } from "@/lib/config/observer";

describe("ecliptic drawing frame", () => {
  it("puts the Sun's ecliptic longitude at the Sun's alt/az (independent ephemeris path)", () => {
    for (const iso of ["2026-09-05T22:30:00Z", "2026-12-21T20:00:00Z", "2027-03-20T18:00:00Z"]) {
      const date = new Date(iso);
      const sun = getBodyPosition("sun", DEFAULT_OBSERVER, date);
      const h = eclipticToHorizontal(sun.eclipticLongitude, 0, createEclipticFrame(DEFAULT_OBSERVER, date));
      expect(Math.abs(h.altitude - sun.horizontal.altitude)).toBeLessThan(0.05);
      const dAz = Math.abs(h.azimuth - sun.horizontal.azimuth);
      expect(Math.min(dAz, 360 - dAz)).toBeLessThan(0.05);
    }
  });

  it("samples the whole ecliptic and places twelve sign boundaries 30° apart", () => {
    const sky = computeZodiacSky(DEFAULT_OBSERVER, new Date("2026-09-05T22:30:00Z"));
    expect(sky.ecliptic.length).toBe(181);
    expect(sky.signs).toHaveLength(12);
    expect(sky.signs[0].sign).toBe("Aries");
    // Half of the ecliptic is always above the horizon (it is a great circle).
    const up = sky.ecliptic.filter((p) => p.horizontal.altitude > 0).length;
    expect(up).toBeGreaterThan(80);
    expect(up).toBeLessThan(100);
  });

  it("maps every sign to a real constellation of the same name", () => {
    expect(Object.keys(SIGN_CONSTELLATION)).toHaveLength(12);
    for (const abbr of Object.values(SIGN_CONSTELLATION)) expect(CONSTELLATIONS[abbr]).toBeDefined();
    expect(ZODIAC_CONSTELLATIONS.size).toBe(12);
    expect(CONSTELLATIONS[SIGN_CONSTELLATION.Virgo]).toBe("Virgo");
  });
});
