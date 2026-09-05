import { describe, expect, it } from "vitest";
import { getHorizontalCoordinates } from "@/lib/astronomy/coordinates";
import { STARS } from "@/lib/catalog/stars";
import { DEFAULT_OBSERVER } from "@/lib/config/observer";
import { DAY_MS, HOUR_MS, PLAY_SPEEDS, SIDEREAL_DAY_MS, TIME_STEPS, fromDateAndTimeInputs, toDateInputValue, toTimeInputValue } from "@/lib/time";

describe("time bar steps", () => {
  it("offers a sidereal-day step that brings every star back to the same spot", () => {
    const sidereal = TIME_STEPS.find((s) => s.label.startsWith("1 sidereal day"));
    expect(sidereal?.ms).toBe(SIDEREAL_DAY_MS);
    const t0 = new Date("2026-09-04T04:30:00Z");
    const t1 = new Date(t0.getTime() + SIDEREAL_DAY_MS);
    for (const star of STARS.filter((s) => s.tier === "bright").slice(0, 50)) {
      const a = getHorizontalCoordinates(star, DEFAULT_OBSERVER, t0);
      const b = getHorizontalCoordinates(star, DEFAULT_OBSERVER, t1);
      expect(Math.abs(a.altitude - b.altitude)).toBeLessThan(0.02);
    }
  });

  it("a solar-day step moves the sky by about one degree (the seasonal drift)", () => {
    const vega = STARS.find((s) => s.name === "Vega")!;
    const t0 = new Date("2026-03-10T05:00:00Z");
    const a = getHorizontalCoordinates(vega, DEFAULT_OBSERVER, t0);
    const b = getHorizontalCoordinates(vega, DEFAULT_OBSERVER, new Date(t0.getTime() + DAY_MS));
    const c = getHorizontalCoordinates(vega, DEFAULT_OBSERVER, new Date(t0.getTime() + HOUR_MS));
    const move = Math.hypot(a.altitude - b.altitude, a.azimuth - b.azimuth);
    expect(move).toBeGreaterThan(0.3);
    expect(move).toBeLessThan(2);
    // ...whereas an hour moves it a lot more.
    expect(Math.hypot(a.altitude - c.altitude, a.azimuth - c.azimuth)).toBeGreaterThan(5);
  });

  it("play speeds are positive and increasing", () => {
    for (let i = 1; i < PLAY_SPEEDS.length; i++) expect(PLAY_SPEEDS[i].factor).toBeGreaterThan(PLAY_SPEEDS[i - 1].factor);
    expect(PLAY_SPEEDS[0].factor).toBe(1);
  });
});

describe("date/time input helpers", () => {
  it("round-trip a local instant to the minute", () => {
    const d = new Date(2026, 8, 3, 21, 30, 0, 0);
    const back = fromDateAndTimeInputs(toDateInputValue(d), toTimeInputValue(d));
    expect(back?.getTime()).toBe(d.getTime());
  });
  it("reject garbage", () => {
    expect(fromDateAndTimeInputs("", "21:30")).toBeNull();
    expect(fromDateAndTimeInputs("2026-09-03", "")).toBeNull();
  });
});
