import { SearchMoonPhase, Seasons } from "astronomy-engine";
import { describe, expect, it } from "vitest";
import { findUpcomingEvents } from "@/lib/astrology/events";
import { getNatalChart } from "@/lib/astrology/natal";

const natal = getNatalChart({
  instant: new Date("1990-03-05T17:30:00Z"),
  location: { latitude: 38.58, longitude: -121.49 },
  timeKnown: true,
});

describe("findUpcomingEvents", () => {
  const from = new Date("2026-09-05T00:00:00Z");
  const events = findUpcomingEvents(from, 60, natal);

  it("returns events sorted by date inside the window", () => {
    for (let i = 1; i < events.length; i++) expect(events[i].date.getTime()).toBeGreaterThanOrEqual(events[i - 1].date.getTime());
    for (const e of events) {
      expect(e.date.getTime()).toBeGreaterThanOrEqual(from.getTime());
      expect(e.date.getTime()).toBeLessThanOrEqual(from.getTime() + 60 * 86_400_000);
    }
  });

  it("places 'Sun enters Libra' at the September equinox (independent season calculation)", () => {
    const equinox = Seasons(2026).sep_equinox.date.getTime();
    const ingress = events.find((e) => e.kind === "ingress" && e.body === "sun" && e.sign === "Libra");
    expect(ingress).toBeDefined();
    expect(Math.abs(ingress!.date.getTime() - equinox)).toBeLessThan(2 * 60_000);
  });

  it("matches the library's New and Full Moon instants", () => {
    const newMoon = SearchMoonPhase(0, from, 40)!.date.getTime();
    const fullMoon = SearchMoonPhase(180, from, 40)!.date.getTime();
    const lunations = events.filter((e) => e.kind === "lunation");
    expect(lunations.some((e) => e.phase === "new" && Math.abs(e.date.getTime() - newMoon) < 1000)).toBe(true);
    expect(lunations.some((e) => e.phase === "full" && Math.abs(e.date.getTime() - fullMoon) < 1000)).toBe(true);
    expect(lunations.length).toBeGreaterThanOrEqual(3); // two months ≈ 2 new + 2 full
  });

  it("finds the solar return within a day of the birthday", () => {
    const around = findUpcomingEvents(new Date("2027-02-20T00:00:00Z"), 30, natal);
    const ret = around.find((e) => e.kind === "return");
    expect(ret).toBeDefined();
    expect(Math.abs(ret!.date.getTime() - Date.UTC(2027, 2, 5, 17, 30))).toBeLessThan(1.5 * 86_400_000);
  });

  it("finds about six Mercury stations in a year", () => {
    const year = findUpcomingEvents(new Date("2026-01-01T00:00:00Z"), 365, null);
    const mercury = year.filter((e) => e.kind === "station" && e.body === "mercury");
    expect(mercury.length).toBeGreaterThanOrEqual(5);
    expect(mercury.length).toBeLessThanOrEqual(7);
    // stations alternate retrograde / direct
    for (let i = 1; i < mercury.length; i++) {
      expect((mercury[i] as { toRetrograde: boolean }).toRetrograde).not.toBe((mercury[i - 1] as { toRetrograde: boolean }).toRetrograde);
    }
  });

  it("works without a birth chart (no transit or return events)", () => {
    const noChart = findUpcomingEvents(from, 60, null);
    expect(noChart.some((e) => e.kind === "transit" || e.kind === "return")).toBe(false);
    expect(noChart.some((e) => e.kind === "lunation")).toBe(true);
  });
});
