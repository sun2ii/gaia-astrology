import { describe, expect, it } from "vitest";
import { STARS } from "@/lib/catalog/stars";
import { DEFAULT_OBSERVER } from "@/lib/config/observer";
import { absoluteMagnitude, decodeSpectralType, lightLeftYear, visibilityCalendar, visualLuminositySuns } from "@/lib/learn/stellar";

describe("decodeSpectralType", () => {
  it("reads class, subclass, luminosity class and colour", () => {
    expect(decodeSpectralType("A0Vvar")).toMatchObject({ class: "A", subclass: 0, luminosity: "V", colour: "white", stage: "main-sequence star" });
    expect(decodeSpectralType("K1.5III")).toMatchObject({ class: "K", subclass: 1.5, luminosity: "III", stage: "giant" });
    expect(decodeSpectralType("M2Ib")).toMatchObject({ class: "M", luminosity: "Ib", colour: "red", stage: "supergiant" });
    expect(decodeSpectralType("B8Ia")).toMatchObject({ luminosity: "Ia", stage: "luminous supergiant" });
    expect(decodeSpectralType("F7:Ib-IIv SB")).toMatchObject({ class: "F", luminosity: "Ib" });
    expect(decodeSpectralType("M1Ib + B2.5V").class).toBe("M");
  });

  it("orders temperatures hottest to coolest across the classes", () => {
    const t = ["O5V", "B5V", "A5V", "F5V", "G5V", "K5V", "M5V"].map((s) => decodeSpectralType(s).temperatureK!);
    for (let i = 1; i < t.length; i++) expect(t[i]).toBeLessThan(t[i - 1]);
    expect(decodeSpectralType("G2V").temperatureK).toBeGreaterThan(5500); // the Sun is ~5,800 K
    expect(decodeSpectralType("G2V").temperatureK).toBeLessThan(6000);
  });

  it("flags peculiarities and copes with non-standard types", () => {
    expect(decodeSpectralType("A0Vvar").notes.join(" ")).toMatch(/variable/);
    expect(decodeSpectralType("F7:Ib-IIv SB").notes.join(" ")).toMatch(/spectroscopic binary/);
    expect(decodeSpectralType("WC8 + O9I").class).toBeUndefined();
    expect(decodeSpectralType(undefined).summary).toMatch(/No spectral type/);
  });

  it("parses the great majority of the catalog", () => {
    const parsed = STARS.filter((s) => decodeSpectralType(s.spectralType).class).length;
    expect(parsed / STARS.length).toBeGreaterThan(0.99);
  });
});

describe("brightness and distance", () => {
  it("gives the Sun absolute magnitude 4.83 by construction, and Sirius about +1.4", () => {
    // A star of apparent magnitude 4.83 at exactly 10 pc (32.6156 ly) has absolute magnitude 4.83.
    expect(absoluteMagnitude(4.83, 32.6156)).toBeCloseTo(4.83, 3);
    expect(visualLuminositySuns(4.83, 32.6156)).toBeCloseTo(1, 3);
    const sirius = STARS.find((s) => s.name === "Sirius")!;
    expect(absoluteMagnitude(sirius.apparentMagnitude, sirius.distanceLightYears!)).toBeCloseTo(1.45, 0);
  });

  it("describes light-travel time sensibly", () => {
    expect(lightLeftYear(25.3, new Date("2026-01-01"))).toMatch(/25 years ago \(around 2001\)/);
    expect(lightLeftYear(0.5)).toMatch(/less than a year/);
    expect(lightLeftYear(2600, new Date("2026-01-01"))).toMatch(/BC/);
  });
});

describe("visibilityCalendar", () => {
  it("knows Polaris never sets and Canopus never rises from California", () => {
    const polaris = STARS.find((s) => s.name === "Polaris")!;
    const canopus = STARS.find((s) => s.name === "Canopus")!;
    expect(visibilityCalendar(polaris, DEFAULT_OBSERVER, 2026).kind).toBe("circumpolar");
    expect(visibilityCalendar(canopus, DEFAULT_OBSERVER, 2026).kind).toBe("never");
  });

  it("puts Orion's Betelgeuse in the winter evening sky and Vega in summer", () => {
    const betelgeuse = STARS.find((s) => s.name === "Betelgeuse")!;
    const vega = STARS.find((s) => s.name === "Vega")!;
    const winter = visibilityCalendar(betelgeuse, DEFAULT_OBSERVER, 2026);
    const summer = visibilityCalendar(vega, DEFAULT_OBSERVER, 2026);
    expect(winter.eveningMonths).toContain(1); // February
    expect(winter.eveningMonths).not.toContain(7); // August
    expect(summer.eveningMonths).toContain(7);
    expect(summer.eveningMonths).not.toContain(1);
  });
});
