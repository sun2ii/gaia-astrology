/**
 * Integrity checks on data/constellations.json and the figure-tier stars.
 */
import { describe, expect, it } from "vitest";
import { CONSTELLATIONS } from "@/lib/astronomy/constellations";
import {
  BRIGHT_STARS,
  CONSTELLATIONS_WITH_FIGURES,
  STARS,
  STAR_CATALOG_META,
  getConstellation,
  getStarById,
} from "@/lib/catalog/stars";

describe("constellations.json", () => {
  it("has exactly one figure for each of the 88 IAU constellations", () => {
    expect(CONSTELLATIONS_WITH_FIGURES).toHaveLength(88);
    const abbrs = CONSTELLATIONS_WITH_FIGURES.map((c) => c.abbreviation);
    expect(new Set(abbrs).size).toBe(88);
    for (const a of abbrs) expect(CONSTELLATIONS[a]).toBeDefined();
    for (const a of Object.keys(CONSTELLATIONS)) expect(abbrs).toContain(a);
  });

  it("uses the same Latin names as the constellation table, and has an English name for each", () => {
    for (const c of CONSTELLATIONS_WITH_FIGURES) {
      expect(c.name).toBe(CONSTELLATIONS[c.abbreviation]);
      expect(c.englishName.length).toBeGreaterThan(0);
    }
  });

  it("references only stars that exist in stars.json, with at least one segment per figure", () => {
    for (const c of CONSTELLATIONS_WITH_FIGURES) {
      expect(c.lines.length).toBeGreaterThan(0);
      for (const line of c.lines) {
        expect(line.length).toBeGreaterThanOrEqual(2);
        for (const id of line) expect(getStarById(id), `${c.abbreviation} references ${id}`).toBeDefined();
      }
    }
  });

  it("draws mostly with stars inside the constellation's own IAU boundary", () => {
    // A handful of figures deliberately borrow a neighbour's star (Auriga uses
    // β Tau, the Great Square of Pegasus uses α And, Serpens passes through
    // Ophiuchus). Anything beyond that would suggest a bad HIP number.
    let outside = 0;
    for (const c of CONSTELLATIONS_WITH_FIGURES) {
      for (const id of new Set(c.lines.flat())) {
        if (getStarById(id)!.constellation !== c.abbreviation) outside++;
      }
    }
    expect(outside).toBeLessThanOrEqual(10);
  });

  it("looks up figures by abbreviation", () => {
    expect(getConstellation("Ori")?.name).toBe("Orion");
    expect(getConstellation("Nope")).toBeUndefined();
  });
});

describe("star tiers", () => {
  it("keeps the bright learning set separate from figure-only stars", () => {
    expect(BRIGHT_STARS.length).toBe(STAR_CATALOG_META.brightStarCount);
    expect(STARS.length).toBe(STAR_CATALOG_META.brightStarCount + STAR_CATALOG_META.figureStarCount);
    for (const s of BRIGHT_STARS) expect(s.apparentMagnitude).toBeLessThanOrEqual(STAR_CATALOG_META.cutoffMagnitude);
    for (const s of STARS.filter((x) => x.tier === "figure")) {
      expect(s.apparentMagnitude).toBeGreaterThan(STAR_CATALOG_META.cutoffMagnitude);
    }
  });

  it("only adds figure stars that some figure actually uses", () => {
    const used = new Set(CONSTELLATIONS_WITH_FIGURES.flatMap((c) => c.lines.flat()));
    for (const s of STARS.filter((x) => x.tier === "figure")) expect(used.has(s.id)).toBe(true);
  });
});
