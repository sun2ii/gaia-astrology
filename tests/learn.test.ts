import { describe, expect, it } from "vitest";
import { ZODIAC_SIGNS } from "@/lib/astrology/types";
import { SOLAR_SYSTEM_BODIES } from "@/lib/astronomy/solarSystem";
import { composePlacement, parsePlacementSlug, placementSlug } from "@/lib/learn/compose";
import { CONCEPTS, getConcept } from "@/lib/learn/concepts";
import { PLANETS, PLANET_ORDER } from "@/lib/learn/planets";
import { SIGNS, SIGN_ORDER } from "@/lib/learn/signs";

describe("learn content", () => {
  it("has a full entry for all 12 signs and 10 bodies", () => {
    expect(SIGN_ORDER).toEqual([...ZODIAC_SIGNS]);
    for (const s of ZODIAC_SIGNS) {
      const e = SIGNS[s];
      for (const field of ["essence", "strengths", "challenges", "asSun", "asMoon", "asRising", "inLove", "atWork"] as const) {
        expect(e[field].length, `${s}.${field}`).toBeGreaterThan(40);
      }
      expect(ZODIAC_SIGNS).toContain(e.opposite);
      expect(SIGNS[e.opposite].opposite).toBe(s); // opposites are symmetric
    }
    expect(PLANET_ORDER).toEqual([...SOLAR_SYSTEM_BODIES]);
    for (const p of SOLAR_SYSTEM_BODIES) {
      const e = PLANETS[p];
      for (const field of ["astronomy", "cycle", "represents", "inBirthChart", "inTransit", "retrograde"] as const) {
        expect(e[field].length, `${p}.${field}`).toBeGreaterThan(30);
      }
    }
  });

  it("every concept's related links resolve", () => {
    for (const c of CONCEPTS) for (const r of c.related) expect(getConcept(r), `${c.slug} -> ${r}`).toBeDefined();
    expect(new Set(CONCEPTS.map((c) => c.slug)).size).toBe(CONCEPTS.length);
  });

  it("composes all 120 placement pages with the same section structure and no template leaks", () => {
    let count = 0;
    for (const p of SOLAR_SYSTEM_BODIES) {
      for (const s of ZODIAC_SIGNS) {
        const page = composePlacement(p, s);
        expect(page.sections.length).toBe(9);
        for (const sec of page.sections) {
          expect(sec.body).not.toMatch(/undefined|\[object|\$\{/);
          expect(sec.body.length).toBeGreaterThan(40);
        }
        expect(parsePlacementSlug(placementSlug(p, s))).toEqual({ planet: p, sign: s });
        count++;
      }
    }
    expect(count).toBe(120);
    expect(parsePlacementSlug("moon-in-nowhere")).toBeNull();
  });

  it("uses 'the' for the Sun and Moon but not for planets", () => {
    expect(composePlacement("moon", "Virgo").title).toBe("The Moon in Virgo");
    expect(composePlacement("uranus", "Capricorn").title).toBe("Uranus in Capricorn");
  });
});
