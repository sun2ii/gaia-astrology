import { Body, SearchMoonPhase, Seasons } from "astronomy-engine";
import { describe, expect, it } from "vitest";
import { MAJOR_ASPECTS, angularSeparation, findAspects } from "@/lib/astrology/aspects";
import { getAstrologyState } from "@/lib/astrology/engine";
import type { PlanetPlacement } from "@/lib/astrology/types";
import { ZODIAC_SIGNS } from "@/lib/astrology/types";
import { formatZodiacPosition, zodiacPosition } from "@/lib/astrology/zodiac";
import { geocentricEclipticOfDate } from "@/lib/astronomy/solarSystem";
import { DEFAULT_OBSERVER } from "@/lib/config/observer";

describe("zodiacPosition", () => {
  it("divides the ecliptic into twelve 30° signs starting at Aries 0°", () => {
    ZODIAC_SIGNS.forEach((sign, i) => {
      expect(zodiacPosition(i * 30).sign).toBe(sign);
      expect(zodiacPosition(i * 30).degree).toBeCloseTo(0);
      expect(zodiacPosition(i * 30 + 29.999).sign).toBe(sign);
    });
  });

  it("maps the worked example 161.4° -> Virgo 11.4°", () => {
    const p = zodiacPosition(161.4);
    expect(p.sign).toBe("Virgo");
    expect(p.degree).toBeCloseTo(11.4);
    expect(formatZodiacPosition(p)).toBe("Virgo 11°24′");
  });

  it("normalises longitudes outside [0, 360)", () => {
    expect(zodiacPosition(360).sign).toBe("Aries");
    expect(zodiacPosition(-1).sign).toBe("Pisces");
    expect(zodiacPosition(-1).degree).toBeCloseTo(29);
    expect(zodiacPosition(725).sign).toBe("Aries");
  });
});

describe("the Sun's sign follows the seasons (tropical zodiac by definition)", () => {
  it("enters Aries at the March equinox, Cancer at the June solstice, Libra and Capricorn likewise", () => {
    const s = Seasons(2026);
    const signAt = (d: Date) => zodiacPosition(geocentricEclipticOfDate(Body.Sun, d).longitude);
    const justAfter = (d: Date) => new Date(d.getTime() + 60_000);
    const justBefore = (d: Date) => new Date(d.getTime() - 60_000);
    expect(signAt(justBefore(s.mar_equinox.date)).sign).toBe("Pisces");
    expect(signAt(justAfter(s.mar_equinox.date)).sign).toBe("Aries");
    expect(signAt(justAfter(s.jun_solstice.date)).sign).toBe("Cancer");
    expect(signAt(justAfter(s.sep_equinox.date)).sign).toBe("Libra");
    expect(signAt(justAfter(s.dec_solstice.date)).sign).toBe("Capricorn");
  });
});

describe("aspects", () => {
  const placement = (body: PlanetPlacement["body"], longitude: number, speed = 1): PlanetPlacement => ({
    body,
    longitude,
    zodiac: zodiacPosition(longitude),
    speed,
    retrograde: speed < 0,
  });

  it("angularSeparation is symmetric and never exceeds 180°", () => {
    expect(angularSeparation(83, 203)).toBeCloseTo(120);
    expect(angularSeparation(203, 83)).toBeCloseTo(120);
    expect(angularSeparation(350, 10)).toBeCloseTo(20);
    expect(angularSeparation(0, 180)).toBeCloseTo(180);
  });

  it("finds the worked example: Moon 83°, Venus 203° -> Moon trine Venus", () => {
    const aspects = findAspects([placement("moon", 83, 13), placement("venus", 203, 1)]);
    expect(aspects).toHaveLength(1);
    expect(aspects[0].name).toBe("trine");
    expect(aspects[0].bodies).toEqual(["moon", "venus"]);
    expect(aspects[0].orb).toBeCloseTo(0);
  });

  it("respects orbs from the table and ignores pairs outside them", () => {
    // 60° sextile has a 6° orb: 66° is in, 67° is out.
    expect(findAspects([placement("sun", 0), placement("mars", 66)])).toHaveLength(1);
    expect(findAspects([placement("sun", 0), placement("mars", 67)])).toHaveLength(0);
    // conjunction across the 0° wrap
    const wrap = findAspects([placement("sun", 358), placement("mercury", 3)]);
    expect(wrap[0]?.name).toBe("conjunction");
    expect(wrap[0]?.orb).toBeCloseTo(5);
  });

  it("marks an aspect applying when the faster body is closing on the exact angle", () => {
    // Moon 5° behind an exact trine to Venus and moving 13°/day faster: applying.
    const applying = findAspects([placement("moon", 78, 13), placement("venus", 203, 1)]);
    expect(applying[0].applying).toBe(true);
    // Moon 5° past the exact trine: separating.
    const separating = findAspects([placement("moon", 88, 13), placement("venus", 203, 1)]);
    expect(separating[0].applying).toBe(false);
  });

  it("accepts a custom aspect table", () => {
    const tight = MAJOR_ASPECTS.map((a) => ({ ...a, orb: 1 }));
    expect(findAspects([placement("sun", 0), placement("mars", 65)], tight)).toHaveLength(0);
  });
});

describe("getAstrologyState against lunar phases", () => {
  it("reports Sun ☌ Moon at a New Moon and Sun ☍ Moon at a Full Moon", () => {
    const newMoon = SearchMoonPhase(0, new Date("2026-06-01T00:00:00Z"), 40)!;
    const fullMoon = SearchMoonPhase(180, new Date("2026-06-01T00:00:00Z"), 40)!;
    const atNew = getAstrologyState(DEFAULT_OBSERVER, newMoon.date);
    const atFull = getAstrologyState(DEFAULT_OBSERVER, fullMoon.date);
    const sunMoon = (aspects: typeof atNew.aspects) =>
      aspects.find((a) => a.bodies[0] === "sun" && a.bodies[1] === "moon");
    expect(sunMoon(atNew.aspects)?.name).toBe("conjunction");
    expect(sunMoon(atNew.aspects)?.orb).toBeLessThan(0.05);
    expect(sunMoon(atFull.aspects)?.name).toBe("opposition");
    expect(sunMoon(atFull.aspects)?.orb).toBeLessThan(0.05);
  });

  it("never marks the Sun or Moon retrograde, and marks Mercury retrograde about three times a year", () => {
    let mercuryFlips = 0;
    let lastRetro: boolean | null = null;
    for (let day = 0; day < 365; day++) {
      const date = new Date(Date.UTC(2026, 0, 1 + day));
      const state = getAstrologyState(DEFAULT_OBSERVER, date);
      const by = new Map(state.planets.map((p) => [p.body, p]));
      expect(by.get("sun")!.retrograde).toBe(false);
      expect(by.get("moon")!.retrograde).toBe(false);
      const retro = by.get("mercury")!.retrograde;
      if (lastRetro !== null && retro !== lastRetro) mercuryFlips++;
      lastRetro = retro;
    }
    // Three retrograde periods per year = ~6 direction changes (5–7 depending on where the year cuts).
    expect(mercuryFlips).toBeGreaterThanOrEqual(5);
    expect(mercuryFlips).toBeLessThanOrEqual(7);
  });

  it("describes itself as tropical and carries the observer and instant through", () => {
    const date = new Date("2026-09-04T04:30:00Z");
    const state = getAstrologyState(DEFAULT_OBSERVER, date);
    expect(state.zodiac).toBe("tropical");
    expect(state.timestamp).toBe(date);
    expect(state.location).toEqual(DEFAULT_OBSERVER);
    expect(state.planets).toHaveLength(10);
  });
});
