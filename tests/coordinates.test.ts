/**
 * Verification of the RA/Dec -> alt/az engine against textbook relationships.
 * No values here are hardcoded from a black box; each expectation follows from
 * spherical astronomy that any reference (Meeus, Duffett-Smith, ...) states.
 */
import { describe, expect, it } from "vitest";
import { createSkyFrame, getHorizontalCoordinates, toHorizontal } from "@/lib/astronomy/coordinates";
import type { Observer, Star } from "@/lib/astronomy/types";
import { STARS } from "@/lib/catalog/stars";
import { DEFAULT_OBSERVER } from "@/lib/config/observer";

const byName = (name: string): Star => {
  const star = STARS.find((s) => s.name === name);
  if (!star) throw new Error(`${name} not in catalog`);
  return star;
};

const SIDEREAL_DAY_MS = 86_164_090.5; // 23h 56m 4.0905s

/** Highest altitude a star reaches in a day, found by sampling every minute. */
function maxAltitudeOverDay(star: Star, observer: Observer, start: Date) {
  let best = { altitude: -90, azimuth: 0 };
  for (let m = 0; m < 24 * 60; m++) {
    const h = getHorizontalCoordinates(star, observer, new Date(start.getTime() + m * 60_000));
    if (h.altitude > best.altitude) best = h;
  }
  return best;
}

describe("Polaris for a California observer", () => {
  const polaris = byName("Polaris");

  it("stays approximately north (azimuth within 2° of 0/360) all year", () => {
    for (let month = 0; month < 12; month++) {
      const date = new Date(Date.UTC(2026, month, 15, 6, 0, 0)); // ~10-11 PM Pacific
      const { azimuth } = getHorizontalCoordinates(polaris, DEFAULT_OBSERVER, date);
      const fromNorth = Math.min(azimuth, 360 - azimuth);
      expect(fromNorth).toBeLessThan(2);
    }
  });

  it("sits at an altitude approximately equal to the observer's latitude", () => {
    // Polaris is 0.74° from the pole (dec 89.26°), so its altitude is latitude ± 0.74°.
    for (let month = 0; month < 12; month++) {
      const date = new Date(Date.UTC(2026, month, 15, 6, 0, 0));
      const { altitude } = getHorizontalCoordinates(polaris, DEFAULT_OBSERVER, date);
      expect(Math.abs(altitude - DEFAULT_OBSERVER.latitude)).toBeLessThan(0.8);
    }
  });
});

describe("observer latitude", () => {
  it("raises Polaris as the observer moves north (altitude of the pole = latitude)", () => {
    const polaris = byName("Polaris");
    const date = new Date("2026-09-04T04:30:00Z");
    const latitudes = [0, 20, 38.68, 50, 70];
    const altitudes = latitudes.map((latitude) => getHorizontalCoordinates(polaris, { latitude, longitude: -121 }, date).altitude);
    for (let i = 1; i < altitudes.length; i++) expect(altitudes[i]).toBeGreaterThan(altitudes[i - 1]);
    latitudes.forEach((lat, i) => expect(Math.abs(altitudes[i] - lat)).toBeLessThan(0.8));
  });

  it("puts a star at maximum altitude 90° − |latitude − declination| when it culminates", () => {
    // Textbook relation for upper culmination. Checked for a star north and
    // south of the zenith, and for a star that passes overhead.
    const start = new Date("2026-01-01T00:00:00Z");
    const cases: Array<{ star: Star; latitude: number }> = [
      { star: byName("Sirius"), latitude: 38.68 }, // dec −16.7, south of zenith
      { star: byName("Vega"), latitude: 38.78 }, // dec +38.78, passes through the zenith
      { star: byName("Deneb"), latitude: 10 }, // dec +45.3, north of zenith
      { star: byName("Canopus"), latitude: -33 }, // southern hemisphere observer
    ];
    for (const { star, latitude } of cases) {
      const observer = { latitude, longitude: -121.2 };
      const best = maxAltitudeOverDay(star, observer, start);
      const expected = 90 - Math.abs(latitude - star.dec);
      // Tolerance 0.3°: the relation holds for the declination *of date*, while
      // star.dec is J2000. Precession moves declinations by up to ~20"/yr, i.e.
      // up to ~0.15° by 2026, and the engine correctly includes that.
      expect(Math.abs(best.altitude - expected)).toBeLessThan(0.3);
      // At culmination the star is due south if it is south of the zenith, due north if north of it.
      if (Math.abs(latitude - star.dec) > 1) {
        const expectedAzimuth = star.dec < latitude ? 180 : 0;
        const diff = Math.min(Math.abs(best.azimuth - expectedAzimuth), 360 - Math.abs(best.azimuth - expectedAzimuth));
        expect(diff).toBeLessThan(1);
      }
    }
  });
});

describe("observer longitude and time", () => {
  it("returns a star to the same place after one sidereal day", () => {
    const vega = byName("Vega");
    const t0 = new Date("2026-09-04T04:30:00Z");
    const a = getHorizontalCoordinates(vega, DEFAULT_OBSERVER, t0);
    const b = getHorizontalCoordinates(vega, DEFAULT_OBSERVER, new Date(t0.getTime() + SIDEREAL_DAY_MS));
    expect(Math.abs(a.altitude - b.altitude)).toBeLessThan(0.02);
    expect(Math.abs(a.azimuth - b.azimuth)).toBeLessThan(0.02);
  });

  it("gives a solar day later a slightly different sky (the 4-minute drift)", () => {
    const vega = byName("Vega");
    const t0 = new Date("2026-09-04T04:30:00Z");
    const a = getHorizontalCoordinates(vega, DEFAULT_OBSERVER, t0);
    const b = getHorizontalCoordinates(vega, DEFAULT_OBSERVER, new Date(t0.getTime() + 86_400_000));
    // Earth rotates ~0.986° more in a solar day than a sidereal one; a star far
    // from the pole must move by a noticeable amount, not zero.
    expect(Math.hypot(a.altitude - b.altitude, a.azimuth - b.azimuth)).toBeGreaterThan(0.3);
  });

  it("moving 15° west and looking 1 hour later shows nearly the same sky", () => {
    // Earth turns 15° per hour, so longitude and time are interchangeable
    // (up to the ~10 s/hour solar-vs-sidereal difference).
    const stars = [byName("Vega"), byName("Sirius"), byName("Antares"), byName("Capella")];
    const t0 = new Date("2026-03-10T05:00:00Z");
    for (const star of stars) {
      const here = getHorizontalCoordinates(star, { latitude: 38.68, longitude: -121.22 }, t0);
      const west = getHorizontalCoordinates(star, { latitude: 38.68, longitude: -136.22 }, new Date(t0.getTime() + 3_600_000));
      expect(Math.abs(here.altitude - west.altitude)).toBeLessThan(0.15);
      const dAz = Math.abs(here.azimuth - west.azimuth);
      expect(Math.min(dAz, 360 - dAz)).toBeLessThan(0.15);
    }
  });

  it("changes a star's position as the hours pass (sky rotates westward)", () => {
    // A star in the south moves from east of the meridian to west of it.
    const sirius = byName("Sirius");
    const observer = DEFAULT_OBSERVER;
    const best = maxAltitudeOverDay(sirius, observer, new Date("2026-02-01T00:00:00Z"));
    // Find the culmination instant again to test around it.
    let culmination = new Date("2026-02-01T00:00:00Z");
    for (let m = 0; m < 24 * 60; m++) {
      const t = new Date(Date.parse("2026-02-01T00:00:00Z") + m * 60_000);
      if (getHorizontalCoordinates(sirius, observer, t).altitude === best.altitude) culmination = t;
    }
    const before = getHorizontalCoordinates(sirius, observer, new Date(culmination.getTime() - 2 * 3_600_000));
    const after = getHorizontalCoordinates(sirius, observer, new Date(culmination.getTime() + 2 * 3_600_000));
    expect(before.azimuth).toBeLessThan(180); // still in the east
    expect(after.azimuth).toBeGreaterThan(180); // now in the west
    expect(before.altitude).toBeLessThan(best.altitude);
    expect(after.altitude).toBeLessThan(best.altitude);
  });
});

describe("output ranges", () => {
  it("keeps azimuth in [0, 360) and altitude in [-90, 90] for every catalog star at many times and places", () => {
    const observers: Observer[] = [
      DEFAULT_OBSERVER,
      { latitude: 0, longitude: 0 },
      { latitude: -45, longitude: 170 },
      { latitude: 89.9, longitude: -30 },
      { latitude: -89.9, longitude: 100 },
    ];
    const dates = [new Date("2026-01-01T00:00:00Z"), new Date("2026-06-21T12:00:00Z"), new Date("2030-11-05T18:37:00Z")];
    for (const observer of observers) {
      for (const date of dates) {
        const frame = createSkyFrame(observer, date);
        for (const star of STARS) {
          const { altitude, azimuth } = toHorizontal(star, frame);
          expect(azimuth).toBeGreaterThanOrEqual(0);
          expect(azimuth).toBeLessThan(360);
          expect(altitude).toBeGreaterThanOrEqual(-90);
          expect(altitude).toBeLessThanOrEqual(90);
        }
      }
    }
  });

  it("rejects impossible observer coordinates", () => {
    const date = new Date();
    expect(() => createSkyFrame({ latitude: 91, longitude: 0 }, date)).toThrow(RangeError);
    expect(() => createSkyFrame({ latitude: 0, longitude: -181 }, date)).toThrow(RangeError);
    expect(() => createSkyFrame({ latitude: Number.NaN, longitude: 0 }, date)).toThrow(RangeError);
  });
});

describe("independent cross-check", () => {
  /**
   * A deliberately simple, textbook alt/az calculation (Meeus, "Astronomical
   * Algorithms": GMST from JD, hour angle, then the standard spherical-triangle
   * formulas). It ignores precession, nutation and aberration, so it agrees
   * with the engine only to a few tenths of a degree — enough to catch sign,
   * unit and azimuth-convention mistakes in our wrapper, which is the point.
   */
  function naiveAltAz(star: Star, observer: Observer, date: Date) {
    const rad = Math.PI / 180;
    const jd = date.getTime() / 86_400_000 + 2_440_587.5;
    const T = (jd - 2_451_545.0) / 36_525;
    let gmst = 280.46061837 + 360.98564736629 * (jd - 2_451_545.0) + 0.000387933 * T * T - (T * T * T) / 38_710_000;
    gmst = ((gmst % 360) + 360) % 360;
    const lst = gmst + observer.longitude;
    const H = (lst - star.ra) * rad; // hour angle
    const phi = observer.latitude * rad;
    const dec = star.dec * rad;
    const sinAlt = Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H);
    const alt = Math.asin(sinAlt);
    // Azimuth measured from North through East (Meeus gives it from South; we shift by 180°).
    const y = Math.sin(H);
    const x = Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi);
    const azFromSouth = Math.atan2(y, x) / rad;
    const az = (((azFromSouth + 180) % 360) + 360) % 360;
    return { altitude: alt / rad, azimuth: az };
  }

  function separationDeg(a: { altitude: number; azimuth: number }, b: { altitude: number; azimuth: number }) {
    const rad = Math.PI / 180;
    const cosSep =
      Math.sin(a.altitude * rad) * Math.sin(b.altitude * rad) +
      Math.cos(a.altitude * rad) * Math.cos(b.altitude * rad) * Math.cos((a.azimuth - b.azimuth) * rad);
    return Math.acos(Math.min(1, Math.max(-1, cosSep))) / rad;
  }

  it("agrees with a textbook formula to within a fraction of a degree for many stars, times and places", () => {
    const observers: Observer[] = [DEFAULT_OBSERVER, { latitude: -33.9, longitude: 151.2 }, { latitude: 51.5, longitude: -0.1 }];
    const dates = [new Date("2026-09-04T04:30:00Z"), new Date("2027-02-14T22:00:00Z"), new Date("2026-06-01T10:00:00Z")];
    let compared = 0;
    for (const observer of observers) {
      for (const date of dates) {
        const frame = createSkyFrame(observer, date);
        for (const star of STARS.filter((s) => Math.abs(s.dec) < 80)) {
          const engine = toHorizontal(star, frame);
          const naive = naiveAltAz(star, observer, date);
          // Compare as an angular separation on the sky (azimuth alone is
          // ill-conditioned near the zenith). Precession alone moves J2000
          // positions ~0.36° by 2026, and the naive formula ignores it, so the
          // two can legitimately differ by up to that much.
          expect(separationDeg(engine, naive)).toBeLessThan(0.6);
          compared++;
        }
      }
    }
    expect(compared).toBeGreaterThan(4000);
  });
});
