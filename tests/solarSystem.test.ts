import { Body, EclipticGeoMoon, MoonPhase, Seasons, SunPosition } from "astronomy-engine";
import { describe, expect, it } from "vitest";
import { geocentricEclipticOfDate, getBodyPosition, getSolarSystemPositions, longitudeDelta } from "@/lib/astronomy/solarSystem";
import { DEFAULT_OBSERVER } from "@/lib/config/observer";

describe("solar-system ecliptic longitudes", () => {
  it("put the Sun at exactly 0° at the March equinox and 90° / 180° / 270° at the other season points", () => {
    for (const year of [2024, 2026, 2030]) {
      const s = Seasons(year);
      expect(geocentricEclipticOfDate(Body.Sun, s.mar_equinox.date).longitude).toBeCloseTo(0, 2);
      expect(geocentricEclipticOfDate(Body.Sun, s.jun_solstice.date).longitude).toBeCloseTo(90, 2);
      expect(geocentricEclipticOfDate(Body.Sun, s.sep_equinox.date).longitude).toBeCloseTo(180, 2);
      expect(geocentricEclipticOfDate(Body.Sun, s.dec_solstice.date).longitude).toBeCloseTo(270, 2);
    }
  });

  it("agree with the library's dedicated Sun and Moon routines", () => {
    for (const iso of ["2026-01-15T00:00:00Z", "2026-09-04T04:30:00Z", "2028-06-01T12:00:00Z"]) {
      const date = new Date(iso);
      expect(geocentricEclipticOfDate(Body.Sun, date).longitude).toBeCloseTo(SunPosition(date).elon, 3);
      expect(geocentricEclipticOfDate(Body.Moon, date).longitude).toBeCloseTo(EclipticGeoMoon(date).lon, 2);
    }
  });

  it("reproduce the Moon's phase angle as Moon − Sun longitude", () => {
    const date = new Date("2026-09-04T04:30:00Z");
    const sun = geocentricEclipticOfDate(Body.Sun, date).longitude;
    const moon = geocentricEclipticOfDate(Body.Moon, date).longitude;
    // MoonPhase() uses a slightly different lunar model; agreement to ~0.01° is expected.
    expect((((moon - sun) % 360) + 360) % 360).toBeCloseTo(MoonPhase(date), 1);
  });

  it("longitudeDelta wraps correctly across 0°/360°", () => {
    expect(longitudeDelta(359, 1)).toBeCloseTo(2);
    expect(longitudeDelta(1, 359)).toBeCloseTo(-2);
    expect(longitudeDelta(10, 190)).toBeCloseTo(180);
  });
});

describe("solar-system positions for an observer", () => {
  const date = new Date("2026-09-04T04:30:00Z");
  const bodies = getSolarSystemPositions(DEFAULT_OBSERVER, date);

  it("returns all ten bodies in conventional order", () => {
    expect(bodies.map((b) => b.id)).toEqual(["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"]);
  });

  it("keeps every body's alt/az in range and its constellation valid", () => {
    for (const b of bodies) {
      expect(b.horizontal.altitude).toBeGreaterThanOrEqual(-90);
      expect(b.horizontal.altitude).toBeLessThanOrEqual(90);
      expect(b.horizontal.azimuth).toBeGreaterThanOrEqual(0);
      expect(b.horizontal.azimuth).toBeLessThan(360);
      expect(b.constellation).toMatch(/^[A-Z][A-Za-z]{2}$/);
      expect(b.eclipticLongitude).toBeGreaterThanOrEqual(0);
      expect(b.eclipticLongitude).toBeLessThan(360);
    }
  });

  it("puts the Sun below the horizon at 9:30 PM in September and above it at noon", () => {
    expect(getBodyPosition("sun", DEFAULT_OBSERVER, date).horizontal.altitude).toBeLessThan(0);
    expect(getBodyPosition("sun", DEFAULT_OBSERVER, new Date("2026-09-03T19:30:00Z")).horizontal.altitude).toBeGreaterThan(45);
  });

  it("keeps the Sun within the zodiac band of constellations and near the ecliptic", () => {
    const zodiacBand = ["Ari", "Tau", "Gem", "Cnc", "Leo", "Vir", "Lib", "Sco", "Oph", "Sgr", "Cap", "Aqr", "Psc"];
    for (let month = 0; month < 12; month++) {
      const b = getBodyPosition("sun", DEFAULT_OBSERVER, new Date(Date.UTC(2026, month, 10)));
      expect(zodiacBand).toContain(b.constellation);
      expect(Math.abs(b.eclipticLatitude)).toBeLessThan(0.01);
    }
  });

  it("gives the Sun ~1°/day and the Moon ~13°/day eastward motion", () => {
    const sun = bodies.find((b) => b.id === "sun")!;
    const moon = bodies.find((b) => b.id === "moon")!;
    expect(sun.eclipticSpeedDegPerDay).toBeGreaterThan(0.95);
    expect(sun.eclipticSpeedDegPerDay).toBeLessThan(1.03);
    expect(moon.eclipticSpeedDegPerDay).toBeGreaterThan(11);
    expect(moon.eclipticSpeedDegPerDay).toBeLessThan(15.5);
  });
});
