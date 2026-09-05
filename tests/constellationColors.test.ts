import { describe, expect, it } from "vitest";
import { CONSTELLATIONS_WITH_FIGURES, STARS } from "@/lib/catalog/stars";
import {
  CONSTELLATION_PALETTE,
  assignConstellationColors,
  constellationNeighbours,
} from "@/lib/chart/constellationColors";

describe("assignConstellationColors", () => {
  const colors = assignConstellationColors(CONSTELLATIONS_WITH_FIGURES, STARS);
  const neighbours = constellationNeighbours(CONSTELLATIONS_WITH_FIGURES, STARS);

  it("gives every constellation a palette colour", () => {
    expect(colors.size).toBe(88);
    for (const c of colors.values()) expect(CONSTELLATION_PALETTE).toContain(c);
  });

  it("never gives two neighbouring constellations the same colour", () => {
    for (const [a, list] of neighbours) {
      for (const b of list) expect(colors.get(a), `${a} and ${b} share a colour`).not.toBe(colors.get(b));
    }
  });

  it("treats well-known neighbours as neighbours (so the guarantee above means something)", () => {
    expect(neighbours.get("UMa")).toContain("Dra");
    expect(neighbours.get("Dra")).toContain("UMi");
    expect(neighbours.get("Ori")).toContain("Tau");
    expect(neighbours.get("Lyr")).toContain("Cyg");
    expect(neighbours.get("Ori")).not.toContain("UMi");
  });

  it("is deterministic", () => {
    const again = assignConstellationColors(CONSTELLATIONS_WITH_FIGURES, STARS);
    expect([...again]).toEqual([...colors]);
  });

  it("degrades gracefully when the palette is too small", () => {
    const tiny = assignConstellationColors(CONSTELLATIONS_WITH_FIGURES, STARS, ["#111", "#222"]);
    expect(tiny.size).toBe(88);
    for (const c of tiny.values()) expect(["#111", "#222"]).toContain(c);
  });
});
