import { describe, expect, it } from "vitest";
import { IDENTITY, apply, applyInverse, arcballPoint, axisAngle, directionOf, isIdentity, multiply, orthonormalize, rotationBetween } from "@/lib/chart/view";

describe("view rotation", () => {
  it("identity leaves the zenith facing the viewer", () => {
    const z = apply(IDENTITY, directionOf(90, 0));
    expect(z[0]).toBeCloseTo(0, 12);
    expect(z[1]).toBeCloseTo(0, 12);
    expect(z[2]).toBeCloseTo(1, 12);
  });

  it("north is up and east is left in the chart frame", () => {
    const n = directionOf(0, 0);
    const e = directionOf(0, 90);
    expect(n[1]).toBeCloseTo(-1);
    expect(e[0]).toBeCloseTo(-1);
  });

  it("the arcball carries the grabbed point to the pointer", () => {
    const a = arcballPoint(0.2, 0.1);
    const b = arcballPoint(-0.4, 0.3);
    const r = rotationBetween(a, b)!;
    const m = axisAngle(r.axis, r.angle);
    const moved = apply(m, a);
    for (let i = 0; i < 3; i++) expect(moved[i]).toBeCloseTo(b[i], 6);
  });

  it("inverse undoes a rotation", () => {
    const m = axisAngle([0, 1, 0], 0.7);
    const v = directionOf(30, 120);
    const back = applyInverse(m, apply(m, v));
    for (let i = 0; i < 3; i++) expect(back[i]).toBeCloseTo(v[i], 9);
  });

  it("stays a rotation after many small steps", () => {
    let m = IDENTITY;
    const step = axisAngle([0.3, 0.5, 0.812], 0.013);
    for (let i = 0; i < 2000; i++) m = multiply(step, m);
    const o = orthonormalize(m);
    const r0 = Math.hypot(o[0], o[1], o[2]);
    expect(r0).toBeCloseTo(1, 9);
    expect(isIdentity(IDENTITY)).toBe(true);
  });
});
