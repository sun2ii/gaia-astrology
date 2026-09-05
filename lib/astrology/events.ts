/**
 * Upcoming sky events, found by scanning the engine forward in time.
 *
 * Kinds:
 *   lunation   — New Moon / Full Moon (exact instants from the library's phase search)
 *   ingress    — a planet enters a new zodiac sign
 *   station    — a planet turns retrograde or direct
 *   transit    — a planet in the sky reaches an EXACT aspect to a point in a birth chart
 *   return     — the Sun returns to its natal position (your astrological birthday)
 *
 * Method: sample once a day, look for a change between consecutive samples,
 * then bisect between the two samples to pin the instant to the minute. No
 * event tables are stored; everything is derived from the ephemeris.
 */
import { SearchMoonPhase } from "astronomy-engine";
import { BODY_INFO, SOLAR_SYSTEM_BODIES, geocentricEclipticOfDate, longitudeDelta, type SolarSystemBodyId } from "@/lib/astronomy/solarSystem";
import { MAJOR_ASPECTS, angularSeparation } from "./aspects";
import type { NatalChart } from "./natal";
import type { AspectName, ZodiacSign } from "./types";
import { zodiacPosition } from "./zodiac";

export type SkyEvent =
  | { kind: "lunation"; date: Date; phase: "new" | "full"; sign: ZodiacSign; title: string; note: string }
  | { kind: "ingress"; date: Date; body: SolarSystemBodyId; sign: ZodiacSign; title: string; note: string }
  | { kind: "station"; date: Date; body: SolarSystemBodyId; toRetrograde: boolean; title: string; note: string }
  | { kind: "transit"; date: Date; body: SolarSystemBodyId; natal: NatalPoint; aspect: AspectName; title: string; note: string }
  | { kind: "return"; date: Date; title: string; note: string };

export type NatalPoint = SolarSystemBodyId | "ascendant";

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

/** Bodies whose sign changes / stations are worth listing (the Moon changes sign every 2–3 days — too noisy). */
const INGRESS_BODIES: SolarSystemBodyId[] = ["sun", "mercury", "venus", "mars", "jupiter", "saturn"];
const STATION_BODIES: SolarSystemBodyId[] = ["mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];
/** Transiting bodies tracked against the chart; the Moon is skipped (it hits everything every month). */
const TRANSIT_BODIES: SolarSystemBodyId[] = ["sun", "mercury", "venus", "mars", "jupiter", "saturn"];
/** Natal points that count as "about you". */
const NATAL_POINTS: NatalPoint[] = ["sun", "moon", "ascendant", "venus", "mars"];

const ASPECT_WORD: Record<AspectName, string> = {
  conjunction: "joins",
  sextile: "gently supports",
  square: "pushes against",
  trine: "flows with",
  opposition: "faces off with",
};

function lon(body: SolarSystemBodyId, t: number): number {
  return geocentricEclipticOfDate(BODY_INFO[body].engine, new Date(t)).longitude;
}

function speed(body: SolarSystemBodyId, t: number): number {
  return longitudeDelta(lon(body, t), lon(body, t + HOUR_MS)) * 24;
}

/** Bisect for the instant where predicate flips from false (at a) to true (at b). */
function bisect(a: number, b: number, test: (t: number) => boolean, toleranceMs = 60_000): number {
  let lo = a;
  let hi = b;
  while (hi - lo > toleranceMs) {
    const mid = (lo + hi) / 2;
    if (test(mid)) hi = mid;
    else lo = mid;
  }
  return hi;
}

function pointLongitude(natal: NatalChart, point: NatalPoint): number | null {
  if (point === "ascendant") return natal.angles?.ascendant.longitude ?? null;
  return natal.planets.find((p) => p.body === point)?.longitude ?? null;
}

function pointName(point: NatalPoint): string {
  return point === "ascendant" ? "Rising sign" : BODY_INFO[point].name;
}

export function findUpcomingEvents(from: Date, days: number, natal: NatalChart | null): SkyEvent[] {
  const events: SkyEvent[] = [];
  const start = from.getTime();
  const end = start + days * DAY_MS;

  // Lunations: exact, from the library.
  for (const [target, phase] of [
    [0, "new"],
    [180, "full"],
  ] as const) {
    let cursor = start;
    for (let guard = 0; guard < 40 && cursor < end; guard++) {
      const found = SearchMoonPhase(target, new Date(cursor), 40);
      if (!found || found.date.getTime() > end) break;
      const sign = zodiacPosition(lon("moon", found.date.getTime())).sign;
      events.push({
        kind: "lunation",
        date: found.date,
        phase,
        sign,
        title: phase === "new" ? `New Moon in ${sign}` : `Full Moon in ${sign}`,
        note:
          phase === "new"
            ? "Sun and Moon together — traditionally a moment for starting things."
            : "Sun and Moon opposite — traditionally a moment of culmination and release.",
      });
      cursor = found.date.getTime() + DAY_MS;
    }
  }

  // Daily samples for everything else.
  const natalLons = new Map<NatalPoint, number>();
  if (natal) for (const p of NATAL_POINTS) {
    const l = pointLongitude(natal, p);
    if (l !== null) natalLons.set(p, l);
  }

  let prev = start;
  const prevLon = new Map<SolarSystemBodyId, number>();
  const prevSpeed = new Map<SolarSystemBodyId, number>();
  const prevDiff = new Map<string, number>();
  for (const b of SOLAR_SYSTEM_BODIES) {
    prevLon.set(b, lon(b, start));
    if (STATION_BODIES.includes(b)) prevSpeed.set(b, speed(b, start));
  }
  const diffKey = (b: SolarSystemBodyId, p: NatalPoint, a: AspectName) => `${b}|${p}|${a}`;
  /**
   * A continuous function that changes sign exactly when the aspect is exact.
   * Conjunction/opposition: signed longitude difference. Other aspects: the
   * unsigned separation minus the aspect angle.
   */
  const signedDiff = (b: SolarSystemBodyId, p: NatalPoint, angle: number, t: number) => {
    const target = natalLons.get(p)!;
    const l = lon(b, t);
    if (angle === 0) return longitudeDelta(target, l);
    if (angle === 180) return longitudeDelta(target + 180, l);
    return angularSeparation(l, target) - angle;
  };
  if (natal) {
    for (const b of TRANSIT_BODIES) for (const p of natalLons.keys()) for (const a of MAJOR_ASPECTS) prevDiff.set(diffKey(b, p, a.name), signedDiff(b, p, a.angle, start));
  }

  for (let t = start + DAY_MS; t <= end + DAY_MS; t += DAY_MS) {
    for (const b of SOLAR_SYSTEM_BODIES) {
      const l0 = prevLon.get(b)!;
      const l1 = lon(b, t);

      // Ingress
      if (INGRESS_BODIES.includes(b)) {
        const s0 = zodiacPosition(l0).sign;
        const s1 = zodiacPosition(l1).sign;
        if (s0 !== s1) {
          const when = bisect(prev, t, (x) => zodiacPosition(lon(b, x)).sign === s1);
          if (when <= end) {
            events.push({
              kind: "ingress",
              date: new Date(when),
              body: b,
              sign: s1,
              title: `${BODY_INFO[b].name} enters ${s1}`,
              note:
                b === "sun"
                  ? `${s1} season begins — the Sun changes sign about once a month.`
                  : `${BODY_INFO[b].name}'s themes take on a ${s1} flavour until it moves on.`,
            });
          }
        }
      }

      // Station
      if (STATION_BODIES.includes(b)) {
        const v0 = prevSpeed.get(b)!;
        const v1 = speed(b, t);
        if (Math.sign(v0) !== Math.sign(v1) && v0 !== 0) {
          const toRetro = v1 < 0;
          const when = bisect(prev, t, (x) => (speed(b, x) < 0) === toRetro);
          if (when <= end) {
            events.push({
              kind: "station",
              date: new Date(when),
              body: b,
              toRetrograde: toRetro,
              title: toRetro ? `${BODY_INFO[b].name} turns retrograde` : `${BODY_INFO[b].name} turns direct`,
              note: toRetro
                ? `${BODY_INFO[b].name} appears to move backwards from here for a while — its themes turn inward.`
                : `${BODY_INFO[b].name} resumes forward motion — its themes move outward again.`,
            });
          }
        }
        prevSpeed.set(b, v1);
      }

      prevLon.set(b, l1);
    }

    // Exact transits and the solar return
    if (natal) {
      for (const b of TRANSIT_BODIES) {
        for (const p of natalLons.keys()) {
          for (const a of MAJOR_ASPECTS) {
            const key = diffKey(b, p, a.name);
            const d0 = prevDiff.get(key)!;
            const d1 = signedDiff(b, p, a.angle, t);
            if (Math.sign(d0) !== Math.sign(d1) && Math.abs(d0) < 20 && Math.abs(d1) < 20) {
              const when = bisect(prev, t, (x) => Math.sign(signedDiff(b, p, a.angle, x)) === Math.sign(d1));
              if (when <= end) {
                if (b === "sun" && p === "sun" && a.name === "conjunction") {
                  events.push({
                    kind: "return",
                    date: new Date(when),
                    title: "Your solar return",
                    note: "The Sun is back exactly where it was when you were born — your astrological birthday.",
                  });
                } else {
                  events.push({
                    kind: "transit",
                    date: new Date(when),
                    body: b,
                    natal: p,
                    aspect: a.name,
                    title: `${BODY_INFO[b].name} ${a.symbol} your ${pointName(p)}`,
                    note: `${BODY_INFO[b].name} ${ASPECT_WORD[a.name]} your ${pointName(p)} exactly (${a.name}).`,
                  });
                }
              }
            }
            prevDiff.set(key, d1);
          }
        }
      }
    }

    prev = t;
  }

  return events.filter((e) => e.date.getTime() >= start && e.date.getTime() <= end).sort((a, b) => a.date.getTime() - b.date.getTime());
}
