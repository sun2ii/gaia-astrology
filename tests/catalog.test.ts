/**
 * Integrity checks on data/stars.json. Reference values come straight from the
 * source catalogs (Hipparcos / SIMBAD), not from this app's own output.
 */
import { describe, expect, it } from "vitest";
import { CONSTELLATIONS } from "@/lib/astronomy/constellations";
import { BRIGHT_STARS, STARS, STAR_CATALOG_META, getStarById } from "@/lib/catalog/stars";

describe("stars.json", () => {
  it("contains approximately 500 bright stars", () => {
    expect(BRIGHT_STARS.length).toBeGreaterThanOrEqual(480);
    expect(BRIGHT_STARS.length).toBeLessThanOrEqual(530);
    expect(STAR_CATALOG_META.starCount).toBe(STARS.length);
  });

  it("has unique ids, unique designations and unique proper names", () => {
    const ids = new Set(STARS.map((s) => s.id));
    const designations = new Set(STARS.map((s) => s.designation));
    const names = STARS.map((s) => s.name).filter((n): n is string => n !== null);
    expect(ids.size).toBe(STARS.length);
    expect(designations.size).toBe(STARS.length);
    expect(new Set(names).size).toBe(names.length);
  });

  it("keeps every field inside its documented range", () => {
    for (const star of STARS) {
      expect(star.ra).toBeGreaterThanOrEqual(0);
      expect(star.ra).toBeLessThan(360);
      expect(star.dec).toBeGreaterThanOrEqual(-90);
      expect(star.dec).toBeLessThanOrEqual(90);
      expect(star.apparentMagnitude).toBeGreaterThan(-2);
      expect(star.apparentMagnitude).toBeLessThan(7);
      expect(CONSTELLATIONS[star.constellation]).toBe(star.constellationName);
      expect(star.catalogIds.hip).toBeGreaterThan(0);
      if (star.distanceLightYears !== undefined) {
        expect(star.distanceLightYears).toBeGreaterThan(4); // nothing is closer than α Cen
        expect(star.distanceLightYears).toBeLessThan(20_000);
      }
    }
  });

  it("does not attach a name to stars the IAU has not named", () => {
    // Roughly half of the 500 brightest stars have IAU names; if this ever
    // approaches 100% something is inventing names.
    const named = BRIGHT_STARS.filter((s) => s.name !== null).length;
    expect(named).toBeGreaterThan(150);
    expect(named).toBeLessThan(BRIGHT_STARS.length * 0.7);
  });

  it("matches a few reference values from the source catalogs", () => {
    // Hipparcos I/239 / SIMBAD values. Positions to 0.01°, magnitudes exact.
    const sirius = getStarById("hip-32349")!;
    expect(sirius.name).toBe("Sirius");
    expect(sirius.designation).toBe("α CMa");
    expect(sirius.constellation).toBe("CMa");
    expect(sirius.apparentMagnitude).toBe(-1.44);
    expect(sirius.ra).toBeCloseTo(101.2872, 2);
    expect(sirius.dec).toBeCloseTo(-16.7161, 2);
    expect(sirius.distanceLightYears).toBeCloseTo(8.6, 0);

    const vega = getStarById("hip-91262")!;
    expect(vega.name).toBe("Vega");
    expect(vega.constellation).toBe("Lyr");
    expect(vega.apparentMagnitude).toBe(0.03);
    expect(vega.ra).toBeCloseTo(279.2347, 2);
    expect(vega.dec).toBeCloseTo(38.7837, 2);

    const polaris = getStarById("hip-11767")!;
    expect(polaris.name).toBe("Polaris");
    expect(polaris.constellation).toBe("UMi");
    expect(polaris.dec).toBeGreaterThan(89);

    // Betelgeuse: Hipparcos parallax is too uncertain, so no distance is published.
    const betelgeuse = getStarById("hip-27989")!;
    expect(betelgeuse.name).toBe("Betelgeuse");
    expect(betelgeuse.distanceLightYears).toBeUndefined();
  });

  it("lists bright stars first, each tier sorted brightest first", () => {
    for (let i = 1; i < BRIGHT_STARS.length; i++) {
      expect(BRIGHT_STARS[i].apparentMagnitude).toBeGreaterThanOrEqual(BRIGHT_STARS[i - 1].apparentMagnitude);
    }
    const firstFigure = STARS.findIndex((s) => s.tier === "figure");
    expect(firstFigure).toBe(BRIGHT_STARS.length);
  });
});
