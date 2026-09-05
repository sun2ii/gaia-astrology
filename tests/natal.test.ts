import { EquatorFromVector, Horizon, Observer as EngineObserver, RotateVector, Rotation_ECT_EQD, Spherical, VectorFromSphere } from "astronomy-engine";
import { describe, expect, it } from "vitest";
import { getChartAngles, houseOf, localSiderealTimeDeg, obliquityDeg, wholeSignHouses } from "@/lib/astrology/angles";
import { getAstrologyState } from "@/lib/astrology/engine";
import { ASPECT_MEANING, BODY_MEANING, HOUSE_MEANING, SIGN_MEANING, aspectSentence, bodyInSign } from "@/lib/astrology/interpretations";
import { findTransits, getNatalChart, type BirthData } from "@/lib/astrology/natal";
import { ZODIAC_SIGNS } from "@/lib/astrology/types";
import { zodiacPosition } from "@/lib/astrology/zodiac";
import { SOLAR_SYSTEM_BODIES } from "@/lib/astronomy/solarSystem";
import type { Observer } from "@/lib/astronomy/types";
import { DEFAULT_OBSERVER } from "@/lib/config/observer";
import { timeZoneOffsetMinutes, zonedLocalToUtc } from "@/lib/time";

/** Alt/az of a point ON the ecliptic (latitude 0) at the given ecliptic-of-date longitude. */
function altAzOfEclipticPoint(longitude: number, observer: Observer, date: Date) {
  const v = VectorFromSphere(new Spherical(0, longitude, 1), date);
  const eq = EquatorFromVector(RotateVector(Rotation_ECT_EQD(date), v));
  return Horizon(date, new EngineObserver(observer.latitude, observer.longitude, 0), eq.ra, eq.dec, undefined);
}

describe("chart angles", () => {
  const cases: Array<{ observer: Observer; date: Date }> = [
    { observer: DEFAULT_OBSERVER, date: new Date("2026-09-04T04:30:00Z") },
    { observer: DEFAULT_OBSERVER, date: new Date("1990-03-05T17:30:00Z") },
    { observer: { latitude: 51.5, longitude: -0.1 }, date: new Date("2000-01-01T00:00:00Z") },
    { observer: { latitude: -33.9, longitude: 151.2 }, date: new Date("2015-07-20T22:15:00Z") },
    { observer: { latitude: 0, longitude: 0 }, date: new Date("2026-03-20T14:46:00Z") },
  ];

  it("puts the Ascendant exactly on the eastern horizon", () => {
    for (const { observer, date } of cases) {
      const { ascendant } = getChartAngles(observer, date);
      const h = altAzOfEclipticPoint(ascendant.longitude, observer, date);
      expect(Math.abs(h.altitude)).toBeLessThan(0.01);
      expect(h.azimuth).toBeGreaterThan(0);
      expect(h.azimuth).toBeLessThan(180); // eastern half
    }
  });

  it("puts the Midheaven exactly on the meridian (due south / due north line)", () => {
    // Note: the MC is where the ecliptic crosses the meridian. It is NOT in
    // general the ecliptic's highest point (that is the "nonagesimal").
    for (const { observer, date } of cases) {
      const { midheaven } = getChartAngles(observer, date);
      const h = altAzOfEclipticPoint(midheaven.longitude, observer, date);
      const onMeridian = Math.min(h.azimuth, Math.abs(h.azimuth - 180), 360 - h.azimuth);
      expect(onMeridian).toBeLessThan(0.01);
      expect(h.altitude).toBeGreaterThan(-90);
    }
  });

  it("uses a sensible obliquity and a sidereal time that advances ~361° per day", () => {
    const d = new Date("2026-09-04T04:30:00Z");
    expect(obliquityDeg(d)).toBeGreaterThan(23.4);
    expect(obliquityDeg(d)).toBeLessThan(23.5);
    const a = localSiderealTimeDeg(d, -121.22);
    const b = localSiderealTimeDeg(new Date(d.getTime() + 86_400_000), -121.22);
    expect((((b - a) % 360) + 360) % 360).toBeCloseTo(0.9856, 2);
  });

  it("whole-sign houses start at the Ascendant's sign and cover all twelve", () => {
    const houses = wholeSignHouses(zodiacPosition(165)); // Virgo 15°
    expect(houses[0]).toMatchObject({ number: 1, sign: "Virgo", cuspLongitude: 150 });
    expect(houses[11].sign).toBe("Leo");
    expect(new Set(houses.map((h) => h.sign)).size).toBe(12);
    expect(houseOf(200, houses).number).toBe(2); // Libra
    expect(houseOf(149, houses).number).toBe(12); // Leo
  });
});

describe("birth chart", () => {
  const birth: BirthData = {
    instant: new Date("1990-03-05T17:30:00Z"),
    location: { latitude: 38.58, longitude: -121.49 },
    timeKnown: true,
    placeLabel: "Sacramento, CA",
  };

  it("gives a Pisces Sun for a March 5 birth (Sun between the Aquarius and Aries boundaries)", () => {
    const chart = getNatalChart(birth);
    expect(chart.planets.find((p) => p.body === "sun")!.zodiac.sign).toBe("Pisces");
    expect(chart.planets).toHaveLength(10);
    expect(chart.angles).toBeDefined();
    expect(chart.houses).toHaveLength(12);
    for (const p of chart.planets) expect(p.house?.number).toBeGreaterThanOrEqual(1);
  });

  it("omits angles and houses when the birth time is unknown", () => {
    const chart = getNatalChart({ ...birth, timeKnown: false });
    expect(chart.angles).toBeUndefined();
    expect(chart.houses).toBeUndefined();
    for (const p of chart.planets) expect(p.house).toBeUndefined();
  });

  it("is the same calculation as the live sky at that instant", () => {
    const chart = getNatalChart(birth);
    const live = getAstrologyState(birth.location, birth.instant);
    chart.planets.forEach((p, i) => {
      expect(p.longitude).toBeCloseTo(live.planets[i].longitude, 6);
      expect(p.retrograde).toBe(live.planets[i].retrograde);
    });
  });

  it("finds transits, tighter than natal aspects, and a planet transits its own natal position by conjunction on a birthday", () => {
    const chart = getNatalChart(birth);
    // On the birthday the Sun returns to (within ~1°) its natal longitude.
    const birthday = new Date("2026-03-05T17:30:00Z");
    const now = getAstrologyState(birth.location, birthday);
    const transits = findTransits(now, chart);
    const solarReturn = transits.find((t) => t.transiting === "sun" && t.natal === "sun");
    expect(solarReturn?.name).toBe("conjunction");
    expect(solarReturn!.orb).toBeLessThan(1.5);
    for (const t of transits) expect(t.orb).toBeLessThanOrEqual(3);
  });
});

describe("time zones for birth times", () => {
  it("converts a Pacific local time to the right instant, with and without daylight saving", () => {
    // 2026-07-01 09:30 PDT = 16:30 UTC; 2026-01-15 09:30 PST = 17:30 UTC
    expect(zonedLocalToUtc({ year: 2026, month: 7, day: 1, hour: 9, minute: 30 }, "America/Los_Angeles")?.toISOString()).toBe("2026-07-01T16:30:00.000Z");
    expect(zonedLocalToUtc({ year: 2026, month: 1, day: 15, hour: 9, minute: 30 }, "America/Los_Angeles")?.toISOString()).toBe("2026-01-15T17:30:00.000Z");
    expect(zonedLocalToUtc({ year: 2026, month: 1, day: 15, hour: 9, minute: 30 }, "UTC")?.toISOString()).toBe("2026-01-15T09:30:00.000Z");
  });
  it("reports offsets and rejects an unknown zone", () => {
    expect(timeZoneOffsetMinutes(Date.UTC(2026, 0, 15), "America/New_York")).toBe(-300);
    expect(timeZoneOffsetMinutes(Date.UTC(2026, 6, 1), "Asia/Kolkata")).toBe(330);
    expect(zonedLocalToUtc({ year: 2026, month: 1, day: 1, hour: 0, minute: 0 }, "Mars/Olympus_Mons")).toBeNull();
  });
});

describe("interpretation data", () => {
  it("covers every body, sign, house and aspect", () => {
    for (const b of SOLAR_SYSTEM_BODIES) expect(BODY_MEANING[b].explain.length).toBeGreaterThan(20);
    for (const s of ZODIAC_SIGNS) expect(SIGN_MEANING[s].keywords.length).toBeGreaterThan(5);
    for (let h = 1; h <= 12; h++) expect(HOUSE_MEANING[h].theme.length).toBeGreaterThan(3);
    for (const a of ["conjunction", "sextile", "square", "trine", "opposition"] as const) expect(ASPECT_MEANING[a].tone).toBeTruthy();
  });
  it("composes readable sentences", () => {
    expect(bodyInSign("sun", "Pisces")).toContain("Your Sun");
    expect(bodyInSign("sun", "Pisces")).toContain("Pisces");
    expect(aspectSentence("saturn", "square", "sun", false)).toContain("Saturn in today's sky is square your natal Sun");
  });
});
