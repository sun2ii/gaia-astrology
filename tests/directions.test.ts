import { describe, expect, it } from "vitest";
import {
  azimuthToCompass,
  azimuthToCompass8,
  compassToWords,
  describeAltitude,
  describeWhereToLook,
} from "@/lib/astronomy/directions";

describe("azimuthToCompass (16-point)", () => {
  it("maps the cardinal and intercardinal points", () => {
    expect(azimuthToCompass(0)).toBe("N");
    expect(azimuthToCompass(90)).toBe("E");
    expect(azimuthToCompass(180)).toBe("S");
    expect(azimuthToCompass(270)).toBe("W");
    expect(azimuthToCompass(45)).toBe("NE");
    expect(azimuthToCompass(135)).toBe("SE");
    expect(azimuthToCompass(225)).toBe("SW");
    expect(azimuthToCompass(315)).toBe("NW");
  });

  it("maps the 16-point sectors (each 22.5° wide, centred on the point)", () => {
    expect(azimuthToCompass(282)).toBe("WNW");
    expect(azimuthToCompass(11.24)).toBe("N");
    expect(azimuthToCompass(11.26)).toBe("NNE");
    expect(azimuthToCompass(348.75)).toBe("N");
    expect(azimuthToCompass(348.7)).toBe("NNW");
  });

  it("wraps around 360 and tolerates negative input", () => {
    expect(azimuthToCompass(360)).toBe("N");
    expect(azimuthToCompass(359.9)).toBe("N");
    expect(azimuthToCompass(-90)).toBe("W");
  });

  it("has an 8-point variant", () => {
    expect(azimuthToCompass8(282)).toBe("W");
    expect(azimuthToCompass8(22)).toBe("N");
    expect(azimuthToCompass8(23)).toBe("NE");
  });

  it("spells out every point", () => {
    expect(compassToWords("WNW")).toBe("west-northwest");
    expect(compassToWords("S")).toBe("south");
  });
});

describe("describeAltitude", () => {
  it("uses the documented bands", () => {
    expect(describeAltitude(-3).label).toBe("below horizon");
    expect(describeAltitude(0).label).toBe("very low");
    expect(describeAltitude(9.9).label).toBe("very low");
    expect(describeAltitude(10).label).toBe("low");
    expect(describeAltitude(29.9).label).toBe("low");
    expect(describeAltitude(30).label).toBe("halfway up");
    expect(describeAltitude(59.9).label).toBe("halfway up");
    expect(describeAltitude(60).label).toBe("high");
    expect(describeAltitude(79.9).label).toBe("high");
    expect(describeAltitude(80).label).toBe("nearly overhead");
    expect(describeAltitude(90).label).toBe("nearly overhead");
  });
});

describe("describeWhereToLook", () => {
  it("produces the example sentence from the spec", () => {
    expect(describeWhereToLook(282, 63)).toBe("Face west-northwest and look high in the sky.");
  });
  it("drops the direction near the zenith, where it is meaningless", () => {
    expect(describeWhereToLook(123, 85)).toBe("Look nearly straight overhead.");
  });
});
