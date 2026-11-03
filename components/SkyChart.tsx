"use client";

import { azimuthToCompass, meanDirection } from "@/lib/astronomy/directions";
import { ZODIAC_SYMBOLS } from "@/lib/astrology/types";
import { ZODIAC_CONSTELLATIONS, type ZodiacSky } from "@/lib/astrology/zodiacSky";
import { useEffect, useMemo, useRef, useState } from "react";
import { EarthCanvas } from "@/components/EarthCanvas";
import { EARTH_LABELS, EARTH_PARALLELS, earthAxis, earthMeridian, earthParallel, earthPointToHorizontal } from "@/lib/chart/earth";
import { starDotRadius, type ChartPoint } from "@/lib/astronomy/projection";
import { type Mat3, apply, arcballPoint, axisAngle, directionOf, multiply, orthonormalize, rotationBetween } from "@/lib/chart/view";
import type { BodyPosition, SolarSystemBodyId } from "@/lib/astronomy/solarSystem";
import type { Constellation, HorizontalCoordinates, Observer, Star } from "@/lib/astronomy/types";

/** Which layers the chart draws. Presentation state only. */
export type ChartLayers = {
  stars: boolean;
  constellations: boolean;
  planets: boolean;
  /** Names on the chart: bright-star names, constellation names, planet names. */
  labels: boolean;
  /** The ecliptic with the twelve sign slices, and the zodiac constellations highlighted. */
  zodiac: boolean;
  /** The Earth at the centre of the sphere, the observer standing on top of it. */
  earth: boolean;
  /** The sky shell: stars, figures, planets, zodiac and the altitude grid. Off = just the planet. */
  sky: boolean;
};

export const DEFAULT_LAYERS: ChartLayers = { stars: true, constellations: true, planets: true, labels: true, zodiac: true, earth: true, sky: true };

export type ChartSelection =
  | { kind: "star"; id: string }
  | { kind: "constellation"; abbreviation: string }
  | { kind: "body"; id: SolarSystemBodyId }
  | null;

type Props = {
  /** Every catalog star with its position right now (bright and figure tiers). */
  positions: Array<{ star: Star; horizontal: HorizontalCoordinates }>;
  constellations: Constellation[];
  /** abbreviation -> colour, from assignConstellationColors(). */
  colors: Map<string, string>;
  /** Sun, Moon and planets with their positions right now. */
  bodies: BodyPosition[];
  layers: ChartLayers;
  /** Where the observer stands; orients the little Earth. */
  observer: Observer;
  /** Ecliptic + sign boundaries for this observer/instant (drawn when layers.zodiac). */
  zodiacSky: ZodiacSky;
  selection: ChartSelection;
  /** The view rotation (identity = looking straight up, north at the top). */
  view: Mat3;
  onView: (view: Mat3) => void;
  /** When set, dragging only turns the sphere about the screen's up axis — it slides along a band. */
  lockToBand?: boolean;
  /** Zodiac view: draw only the ecliptic band, the sign glyphs and the twelve zodiac figures. */
  zodiacOnly?: boolean;
  onSelectStar: (id: string) => void;
  onSelectConstellation: (abbreviation: string) => void;
  onSelectBody: (id: SolarSystemBodyId) => void;
};

const R = 300; // chart radius in SVG units
const MARGIN = 28; // room for the compass letters
const EARTH_FRACTION = 0.9; // planet radius as a fraction of the horizon radius
const LABEL_MAGNITUDE = 1.6; // stars brighter than this get a permanent name label

/** Band lock: the screen's up axis, and the sign that makes the sphere follow the pointer. */
const BAND_AXIS: [number, number, number] = [0, -1, 0];
const bandSign = apply(axisAngle(BAND_AXIS, 0.3), [0, 0, 1])[0] > 0 ? 1 : -1;

/** Segments whose ends are both this far below the horizon are not drawn at all. */
const LINE_CUTOFF_ALTITUDE = -8;

export function SkyChart({
  positions,
  constellations,
  colors,
  bodies,
  layers: layersIn,
  observer,
  zodiacSky,
  selection,
  view,
  onView,
  lockToBand = false,
  zodiacOnly = false,
  onSelectStar,
  onSelectConstellation,
  onSelectBody,
}: Props) {
  // The zodiac view strips the chart down to the band and its figures.
  const layers: ChartLayers = zodiacOnly ? { ...layersIn, stars: false, planets: false, earth: false, zodiac: true, constellations: true } : layersIn;
  const byId = new Map(positions.map((p) => [p.star.id, p]));
  const selectedConstellation =
    selection?.kind === "constellation"
      ? selection.abbreviation
      : selection?.kind === "star"
        ? byId.get(selection.id)?.star.constellation ?? null
        : null;

  const size = (R + MARGIN) * 2;

  // The sky is a sphere. alt/az -> unit vector in the chart frame (east left,
  // north up, zenith towards the viewer) -> view rotation -> orthographic
  // projection. z > 0 is the near hemisphere.
  const proj = (h: HorizontalCoordinates): ChartPoint & { z: number } => {
    const v = apply(view, directionOf(h.altitude, h.azimuth));
    return { x: v[0] * R, y: v[1] * R, z: v[2] };
  };
  const turned = !(Math.abs(view[8] - 1) < 1e-6); // zenith no longer facing the viewer
  /** On the near side of the sphere. With no tilt this is exactly "above the horizon". */
  const near = (h: HorizontalCoordinates) => proj(h).z > 0;
  /** Within a few degrees of the limb: segments whose ends are both further behind are not drawn. */
  const LIMB = Math.sin((LINE_CUTOFF_ALTITUDE * Math.PI) / 180);
  const nearish = (h: HorizontalCoordinates) => proj(h).z > LIMB;
  /** A small circle or great circle on the sphere as the visible runs of a polyline. */
  const curve = (points: HorizontalCoordinates[]): string => {
    let d = "";
    let pen = false;
    for (const h of points) {
      const p = proj(h);
      if (p.z < 0) {
        pen = false;
        continue;
      }
      d += `${pen ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      pen = true;
    }
    return d;
  };
  const altitudeRing = (altitude: number) => curve(Array.from({ length: 73 }, (_, i) => ({ altitude, azimuth: i * 5 })));
  const meridian = (azimuth: number) =>
    curve([
      ...Array.from({ length: 19 }, (_, i) => ({ altitude: i * 5, azimuth })),
      ...Array.from({ length: 19 }, (_, i) => ({ altitude: 90 - i * 5, azimuth: azimuth + 180 })),
    ]);
  /** Compass letters sit just outside the horizon, on the near side only. */
  const rimLabel = (azimuth: number, push: number) => {
    const p = proj({ altitude: 0, azimuth });
    if (p.z < -0.05) return null;
    const len = Math.hypot(p.x, p.y) || 1;
    return { x: p.x + (p.x / len) * push, y: p.y + (p.y / len) * push };
  };

  // Hand drag, arcball style: the point you grab stays under your finger, and
  // the sphere keeps turning briefly after you let go.
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    grab: [number, number, number];
    start: Mat3;
    moved: boolean;
    samples: Array<{ t: number; axis: [number, number, number]; angle: number }>;
  } | null>(null);
  const pending = useRef<Mat3 | null>(null);
  const raf = useRef<number | null>(null);
  const spin = useRef<{ axis: [number, number, number]; omega: number; last: number; raf: number } | null>(null);
  const [moving, setMoving] = useState(false);
  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  /** Pointer -> point on the unit sphere, in view space. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sphereAt = (e: { clientX: number; clientY: number }) => {
    const box = svgRef.current!.getBoundingClientRect();
    const scale = (2 * (R + MARGIN)) / box.width;
    const x = ((e.clientX - box.left) * scale - (R + MARGIN)) / R;
    const y = ((e.clientY - box.top) * scale - (R + MARGIN)) / R;
    return arcballPoint(x, y);
  };
  const stopSpin = () => {
    if (spin.current) {
      window.cancelAnimationFrame(spin.current.raf);
      spin.current = null;
      setMoving(false);
    }
  };
  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    stopSpin();
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, grab: sphereAt(e), start: view, moved: false, samples: [] };
    svgRef.current?.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 3) return;
    if (!d.moved) setMoving(true);
    d.moved = true;
    const now = sphereAt(e);
    let next: Mat3;
    if (lockToBand) {
      // Slide along the band: a turn about screen-up, sized by the sideways travel of the pointer.
      const box = svgRef.current!.getBoundingClientRect();
      const theta = ((e.clientX - d.x) / box.width) * Math.PI * bandSign;
      next = orthonormalize(multiply(axisAngle(BAND_AXIS, theta), d.start));
    } else {
      const r = rotationBetween(d.grab, now);
      if (!r) return;
      next = orthonormalize(multiply(axisAngle(r.axis, r.angle), d.start));
    }
    // Velocity samples for the release: the rotation between this and the previous frame.
    const prev = viewRef.current;
    const prevN = apply(prev, [0, 0, 1]);
    const nextN = apply(next, [0, 0, 1]);
    const step = rotationBetween(prevN, nextN) ?? rotationBetween(d.grab, now)!;
    d.samples.push({ t: e.timeStamp, axis: step.axis, angle: step.angle });
    if (d.samples.length > 6) d.samples.shift();
    // Pointer events arrive faster than frames; keep only the latest and apply it once per frame.
    pending.current = next;
    if (raf.current === null) {
      raf.current = window.requestAnimationFrame(() => {
        raf.current = null;
        if (pending.current) onView(pending.current);
        pending.current = null;
      });
    }
  };
  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    svgRef.current?.releasePointerCapture(e.pointerId);
    // Inertia: angular velocity from the last few samples, decaying with friction.
    const recent = d.samples.filter((s) => e.timeStamp - s.t < 120);
    if (d.moved && !lockToBand && recent.length >= 2) {
      const dt = recent[recent.length - 1].t - recent[0].t;
      const total = recent.reduce((a, s) => a + s.angle, 0);
      const omega = dt > 0 ? total / dt : 0; // radians per ms
      const axis = recent[recent.length - 1].axis;
      if (omega > 0.0004) {
        const tick = (t: number) => {
          const sp = spin.current;
          if (!sp) return;
          const dtMs = Math.min(50, t - sp.last);
          sp.last = t;
          onView(orthonormalize(multiply(axisAngle(sp.axis, sp.omega * dtMs), viewRef.current)));
          sp.omega *= Math.pow(0.94, dtMs / 16);
          if (sp.omega < 0.00002) {
            spin.current = null;
            setMoving(false);
            return;
          }
          sp.raf = window.requestAnimationFrame(tick);
        };
        spin.current = { axis, omega, last: e.timeStamp, raf: window.requestAnimationFrame(tick) };
      } else {
        setMoving(false);
      }
    } else {
      setMoving(false);
    }
    // keep `moved` until the click that follows the release has been swallowed
    window.setTimeout(() => (drag.current = null), 0);
  };
  // ---- The little Earth ----
  // Outlines as directions in the observer's frame: only change when the observer moves.
  const earth = layers.earth;
  const graticule = useMemo(
    () =>
      layers.earth
        ? {
            parallels: EARTH_PARALLELS.map((p) => ({ ...p, points: earthParallel(p.latitude, observer) })),
            meridians: [0, 90, 180, -90].map((lon) => earthMeridian(lon, observer)),
            labels: EARTH_LABELS.map((l) => ({ ...l, dir: earthPointToHorizontal(l.latitude, l.longitude, observer) })),
          }
        : null,
    [layers.earth, observer],
  );
  const EARTH_R = R * EARTH_FRACTION;
  /** Project a direction onto the little sphere (same view as the stars, smaller radius). */
  const projEarth = (h: HorizontalCoordinates) => {
    const p = proj(h);
    return { x: (p.x * EARTH_R) / R, y: (p.y * EARTH_R) / R, z: p.z };
  };
  // Day and night: the Sun's direction, projected, sets a gradient across the disc whose
  // transition sits where the terminator crosses the Sun–antisun axis (at -sun.z from centre).
  const sun = bodies.find((b) => b.id === "sun");
  const axis = earthAxis(observer);
  /** Visible runs of a curve on the planet's surface. */
  const earthCurve = (points: HorizontalCoordinates[]): string => {
    let d = "";
    let pen = false;
    for (const h of points) {
      const p = projEarth(h);
      if (p.z < 0.02) {
        pen = false;
        continue;
      }
      d += `${pen ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      pen = true;
    }
    return d;
  };
  // Where the Sun is straight overhead right now: the centre of the day side.
  const subsolar = sun ? projEarth(sun.horizontal) : null;
  const axisN = projEarth(axis.north);
  const axisS = projEarth(axis.south);
  const here = projEarth({ altitude: 90, azimuth: 0 });

  // Every star projected exactly once per render; everything below reads from this.
  const projected = useMemo(() => {
    const m = new Map<string, ChartPoint & { z: number }>();
    for (const q of positions) m.set(q.star.id, proj(q.horizontal));
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- proj is derived from view
  }, [positions, view]);
  const P = (id: string) => projected.get(id)!;

  // Constellation figures as path strings, rebuilt only when the stars move or the view turns.
  const figures = useMemo(() => {
    const out = new Map<string, { d: string; label: { x: number; y: number } | null }>();
    for (const c of constellations) {
      let d = "";
      let n = 0;
      let sx = 0;
      let sy = 0;
      let count = 0;
      for (const line of c.lines) {
        for (let i = 0; i < line.length; i++) {
          const pa = projected.get(line[i]);
          if (!pa) continue;
          if (pa.z > 0) {
            sx += pa.x;
            sy += pa.y;
            count++;
          }
          if (i === 0) continue;
          const pb = projected.get(line[i - 1]);
          if (!pb) continue;
          if (pa.z <= LIMB && pb.z <= LIMB) continue;
          d += `M${pb.x.toFixed(1)},${pb.y.toFixed(1)}L${pa.x.toFixed(1)},${pa.y.toFixed(1)}`;
          n++;
        }
      }
      if (n > 0) out.set(c.abbreviation, { d, label: count >= 2 ? { x: sx / count, y: sy / count } : null });
    }
    return out;
  }, [projected, constellations, LIMB]);

  // Bright stars on the near side, shared by the path, the labels, and picking.
  const brightVisible = positions
    .filter((q) => q.star.tier === "bright" && P(q.star.id).z > 0)
    .map(({ star, horizontal }) => {
      const p = P(star.id);
      const r = starDotRadius(star.apparentMagnitude, R);
      const isSelected = selection?.kind === "star" && selection.id === star.id;
      const showLabel = Boolean(star.name && ((layers.labels && star.apparentMagnitude < LABEL_MAGNITUDE) || isSelected));
      return { star, horizontal, p, r, isSelected, showLabel };
    });
  const selectedBright = brightVisible.find((q) => q.isSelected) ?? null;

  // Picking: a tap selects the nearest bright star within reach, however small the dot.
  // Replaces per-star hit elements (hundreds of DOM nodes) and gives phones a generous target.
  const PICK_RADIUS = 14; // chart units (~44px on a phone)
  const toChart = (e: { clientX: number; clientY: number }) => {
    const svg = svgRef.current!;
    const box = svg.getBoundingClientRect();
    const scale = (2 * (R + MARGIN)) / box.width;
    return { x: (e.clientX - box.left) * scale - (R + MARGIN), y: (e.clientY - box.top) * scale - (R + MARGIN) };
  };
  const nearestStar = (pt: { x: number; y: number }) => {
    let best: (typeof brightVisible)[number] | null = null;
    let bestD = PICK_RADIUS * PICK_RADIUS;
    for (const q of brightVisible) {
      const dx = q.p.x - pt.x;
      const dy = q.p.y - pt.y;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = q;
      }
    }
    return best;
  };
  const hoverRing = useRef<SVGCircleElement>(null);
  const onHover = (e: React.PointerEvent<SVGSVGElement>) => {
    if (drag.current?.moved || !hoverRing.current) return;
    const q = layers.stars ? nearestStar(toChart(e)) : null;
    const ring = hoverRing.current;
    if (q) {
      ring.setAttribute("cx", q.p.x.toFixed(1));
      ring.setAttribute("cy", q.p.y.toFixed(1));
      ring.setAttribute("r", (q.r + 4).toFixed(1));
      ring.style.opacity = "1";
      svgRef.current!.style.cursor = "pointer";
    } else {
      ring.style.opacity = "0";
      svgRef.current!.style.cursor = "";
    }
  };
  const onBackgroundClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (drag.current?.moved || !layers.stars) return;
    const q = nearestStar(toChart(e));
    if (q) onSelectStar(q.star.id);
  };

  const swallowClickAfterDrag = (e: React.MouseEvent) => {
    if (drag.current?.moved) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  return (
    <figure className="chart">
      {layers.earth ? (
        <EarthCanvas
          observer={observer}
          view={view}
          sun={sun ? sun.horizontal : null}
          radiusFraction={EARTH_FRACTION}
          insetFraction={MARGIN / (2 * (R + MARGIN))}
          moving={moving}
        />
      ) : null}
      <svg
        ref={svgRef}
        viewBox={`${-(R + MARGIN)} ${-(R + MARGIN)} ${size} ${size}`}
        role="img"
        aria-label="Sky chart: zenith at the centre, horizon at the rim, north at the top. Drag sideways to turn it, up or down to tip it."
        className={turned ? "turned" : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={(e) => {
          onPointerMove(e);
          onHover(e);
        }}
        onClick={onBackgroundClick}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={swallowClickAfterDrag}
      >
        <defs>
          <clipPath id="horizon-clip">
            <circle cx={0} cy={0} r={R} />
          </clipPath>
          {/* Lighting for the dome: lit from the upper left, darkening towards the rim. */}
          <radialGradient id="dome-sky" cx="42%" cy="36%" r="72%">
            <stop offset="0" stopColor="#1d2b50" />
            <stop offset="0.5" stopColor="#0f1731" />
            <stop offset="1" stopColor="#05070f" />
          </radialGradient>
          <radialGradient id="dome-sheen" cx="34%" cy="28%" r="42%">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.11" />
            <stop offset="0.6" stopColor="#ffffff" stopOpacity="0.03" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="dome-curve" cx="50%" cy="50%" r="50%">
            <stop offset="0.82" stopColor="#000000" stopOpacity="0" />
            <stop offset="1" stopColor="#000000" stopOpacity="0.5" />
          </radialGradient>
          <linearGradient id="dome-horizon" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffe6ad" />
            <stop offset="0.45" stopColor="#c9a25c" />
            <stop offset="1" stopColor="#4a3a1e" />
          </linearGradient>
        </defs>

        {/* Dome background and altitude rings */}
        {/* The sky disc; with the planet on, it becomes a ring so the canvas underneath shows through. */}
        {layers.earth ? (
          <path
            className="chart-sky"
            fill="url(#dome-sky)"
            fillRule="evenodd"
            d={`M${-R},0a${R},${R} 0 1,0 ${2 * R},0a${R},${R} 0 1,0 ${-2 * R},0Z M${-EARTH_R},0a${EARTH_R},${EARTH_R} 0 1,0 ${2 * EARTH_R},0a${EARTH_R},${EARTH_R} 0 1,0 ${-2 * EARTH_R},0Z`}
          />
        ) : (
          <circle className="chart-sky" cx={0} cy={0} r={R} fill="url(#dome-sky)" />
        )}
        {layers.sky && !zodiacOnly ? [30, 60].map((alt) => (
          <path key={alt} className="chart-ring" d={altitudeRing(alt)} />
        )) : null}
        {layers.sky && !zodiacOnly ? <path className="chart-ring" d={meridian(0)} /> : null}
        {layers.sky && !zodiacOnly ? <path className="chart-ring" d={meridian(90)} /> : null}
        {layers.sky && !zodiacOnly ? [30, 60].map((alt) => {
          const p = proj({ altitude: alt, azimuth: 0 });
          return p.z > 0 ? (
            <text key={alt} className="chart-ring-label" x={p.x + 4} y={p.y - 3}>
              {alt}°
            </text>
          ) : null;
        }) : null}
        {/* The true horizon: coincides with the rim until the sphere is tipped. */}
        {turned && !zodiacOnly ? <path className="chart-horizon-line" d={altitudeRing(0)} /> : null}

        {/* Compass points. East is on the LEFT because we are looking up. */}
        {!zodiacOnly && [
          ["N", 0],
          ["E", 90],
          ["S", 180],
          ["W", 270],
        ].map(([label, az]) => {
          const p = rimLabel(az as number, 20);
          return p ? (
            <text key={label} className="chart-compass" x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle">
              {label}
            </text>
          ) : null;
        })}
        {!zodiacOnly && [45, 135, 225, 315].map((az) => {
          const p = rimLabel(az, 17);
          return p ? (
            <text key={az} className="chart-compass-minor" x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle">
              {azimuthToCompass(az)}
            </text>
          ) : null;
        })}

        {/* The little Earth: ocean, land, day/night, axis, and you. Drawn under the sky so the stars pass in front. */}
        {earth ? (
          <g className="chart-earth" aria-label="Earth, seen from the observer's zenith">
            <defs>
              <clipPath id="earth-clip">
                <circle cx={0} cy={0} r={EARTH_R} />
              </clipPath>
            </defs>
            <circle className="chart-earth-shadow" cx={0} cy={EARTH_R * 0.06} r={EARTH_R * 1.03} />
            <circle className="chart-earth-atmo" cx={0} cy={0} r={EARTH_R + 3} />
            {graticule ? (
              <g className="chart-earth-grid">
                {graticule.parallels.map((p) => (
                  <path key={p.name} className={p.latitude === 0 ? "chart-earth-equator" : "chart-earth-parallel"} d={earthCurve(p.points)}>
                    <title>{p.name}</title>
                  </path>
                ))}
                {graticule.meridians.map((m, i) => (
                  <path key={i} className="chart-earth-parallel" d={earthCurve(m)} />
                ))}
              </g>
            ) : null}
            {graticule && layers.labels
              ? graticule.labels.map((l) => {
                  const p = projEarth(l.dir);
                  return p.z > 0.15 ? (
                    <text key={l.name} className={`chart-earth-label ${l.kind}`} x={p.x} y={p.y} textAnchor="middle" style={{ opacity: Math.min(1, (p.z - 0.15) * 2.5) }}>
                      {l.name}
                    </text>
                  ) : null;
                })
              : null}
            {subsolar && subsolar.z > 0 ? (
              <g className="chart-earth-subsolar">
                <circle cx={subsolar.x} cy={subsolar.y} r={4} />
                <title>Sun overhead here right now</title>
              </g>
            ) : null}
            <circle className="chart-earth-limb" cx={0} cy={0} r={EARTH_R} />
            {/* Axis: the planet spins about the line that points at the celestial pole. */}
            {axisN.z > 0 ? (
              <line className="chart-earth-axis" x1={axisN.x} y1={axisN.y} x2={axisN.x * 1.3} y2={axisN.y * 1.3} />
            ) : null}
            {axisS.z > 0 ? (
              <line className="chart-earth-axis" x1={axisS.x} y1={axisS.y} x2={axisS.x * 1.3} y2={axisS.y * 1.3} />
            ) : null}
            {axisN.z > 0 ? (
              <text className="chart-earth-pole" x={axisN.x} y={axisN.y - 6} textAnchor="middle">
                N
              </text>
            ) : null}
            {axisS.z > 0 ? (
              <text className="chart-earth-pole" x={axisS.x} y={axisS.y + 12} textAnchor="middle">
                S
              </text>
            ) : null}
            {/* You are here: the observer stands at the top of the planet, under the zenith. */}
            {here.z > 0 ? (
              <g className="chart-earth-here">
                <circle cx={here.x} cy={here.y} r={5} className="chart-earth-here-ring" />
                <circle cx={here.x} cy={here.y} r={2.2} />
              </g>
            ) : null}
          </g>
        ) : null}

        {layers.sky ? <g clipPath="url(#horizon-clip)">
          {/* The zodiac: the ecliptic and the twelve sign slices along it */}
          {layers.zodiac ? (
            <g className="chart-zodiac">
              {!zodiacOnly && zodiacSky.ecliptic.map((pt, i) => {
                if (i === 0) return null;
                const prev = zodiacSky.ecliptic[i - 1];
                if (!nearish(pt.horizontal) && !nearish(prev.horizontal)) return null;
                const a = proj(prev.horizontal);
                const b = proj(pt.horizontal);
                return <line key={i} className="chart-ecliptic" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
              })}
              {/* The twelve sign slices: a tick at each 0° and the glyph mid-slice. */}
              {zodiacSky.signs.map(({ sign, start, middle }) => {
                const st = proj(start);
                const m = proj(middle);
                return (
                  <g key={sign} className="chart-sign">
                    {st.z > LIMB && !zodiacOnly ? <circle className="chart-sign-tick" cx={st.x} cy={st.y} r={3.5} /> : null}
                    {m.z > 0 ? (
                      <text className="chart-sign-glyph" x={m.x} y={m.y - 8} textAnchor="middle">
                        {ZODIAC_SYMBOLS[sign]}
                        <title>{sign} — the sign slice, 30° of the ecliptic (not the constellation)</title>
                      </text>
                    ) : null}
                  </g>
                );
              })}
            </g>
          ) : null}

          {/* Constellation figures */}
          {layers.constellations && constellations.map((c) => {
            if (zodiacOnly && !ZODIAC_CONSTELLATIONS.has(c.abbreviation)) return null;
            const fig = figures.get(c.abbreviation);
            if (!fig) return null;
            const { d, label } = fig;
            const isSelected = c.abbreviation === selectedConstellation;
            const isZodiac = ZODIAC_CONSTELLATIONS.has(c.abbreviation);
            const dimmed = (selectedConstellation !== null && !isSelected) || (layers.zodiac && !isZodiac && !isSelected);
            const emphasised = layers.zodiac && isZodiac && !dimmed;
            const color = colors.get(c.abbreviation) ?? "#8d95a8";
            return (
              <g
                key={c.abbreviation}
                className={`chart-constellation${isSelected ? " selected" : ""}${dimmed ? " dimmed" : ""}${emphasised ? " emphasised" : ""}`}
                style={{ "--constellation-color": color } as React.CSSProperties}
                onClick={() => onSelectConstellation(c.abbreviation)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onSelectConstellation(c.abbreviation);
                }}
              >
                <title>
                  {c.name} ({c.englishName})
                </title>
                {/* All segments as one path (and one wider invisible twin to click on): far fewer DOM nodes per frame. */}
                <path className="chart-figure" d={d} />
                <path className="chart-hit" d={d} />
                {label && (layers.labels || isSelected || emphasised) ? (
                  <text className="chart-constellation-label" x={label.x} y={label.y} textAnchor="middle">
                    {c.name}
                  </text>
                ) : null}
              </g>
            );
          })}

          {/* Stars: figure-only stars first (small), bright stars on top.
              With the star layer off, figure-only stars still draw faintly when constellations are on, so figures have vertices. */}
          {(layers.stars || layers.constellations) ? (
            <path
              className="chart-figure-stars"
              d={positions
                .filter((p) => (zodiacOnly ? ZODIAC_CONSTELLATIONS.has(p.star.constellation) : p.star.tier === "figure") && P(p.star.id).z > 0)
                .map(({ star }) => {
                  const p = P(star.id);
                  const r = starDotRadius(star.apparentMagnitude, R);
                  return `M${(p.x - r).toFixed(1)},${p.y.toFixed(1)}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0`;
                })
                .join("")}
            />
          ) : null}
          {layers.stars ? (
            <path
              className="chart-bright-stars"
              d={brightVisible
                .map(({ p, r }) => `M${(p.x - r).toFixed(1)},${p.y.toFixed(1)}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0`)
                .join("")}
            />
          ) : null}
          {layers.stars
            ? brightVisible.map(({ star, p, r, isSelected, showLabel }) =>
                showLabel ? (
                  <text key={star.id} className={`chart-star-label${isSelected ? " selected" : ""}`} x={p.x + r + 3} y={p.y - r - 2}>
                    {star.name}
                  </text>
                ) : null,
              )
            : null}
          {/* Hover ring, moved imperatively so pointer movement never re-renders the chart. */}
          <circle ref={hoverRing} className="chart-hover-ring" r={0} cx={0} cy={0} />
          {selectedBright ? (
            <circle className="chart-selected-ring" cx={selectedBright.p.x} cy={selectedBright.p.y} r={selectedBright.r + 4} />
          ) : null}

          {/* Sun, Moon and planets */}
          {layers.planets && bodies
            .filter((b) => near(b.horizontal))
            .map((b) => {
              const p = proj(b.horizontal);
              const isSelected = selection?.kind === "body" && selection.id === b.id;
              const r = b.id === "sun" ? 9 : b.id === "moon" ? 7 : 4.5;
              return (
                <g
                  key={b.id}
                  className={`chart-body ${b.id}${isSelected ? " selected" : ""}${b.horizontal.altitude < 0 ? " below" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectBody(b.id);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") onSelectBody(b.id);
                  }}
                >
                  <title>
                    {b.symbol} {b.name} · {b.constellationName} · {azimuthToCompass(b.horizontal.azimuth)}{" "}
                    {Math.round(b.horizontal.altitude)}°
                  </title>
                  <circle className="chart-hit" cx={p.x} cy={p.y} r={r + 6} />
                  <circle cx={p.x} cy={p.y} r={r} />
                  <text className="chart-body-label" x={p.x + r + 3} y={p.y + 4}>
                    {layers.labels || isSelected ? `${b.symbol} ${b.name}` : b.symbol}
                  </text>
                </g>
              );
            })}
        </g> : null}

        {/* Curvature shading and a soft highlight, over the stars so the dome reads as a lit sphere. */}
        <circle className="chart-overlay" cx={0} cy={0} r={R} fill="url(#dome-curve)" />
        <circle className="chart-overlay" cx={0} cy={0} r={R} fill="url(#dome-sheen)" />
        <circle className="chart-horizon" cx={0} cy={0} r={R} stroke="url(#dome-horizon)" />

        {/* Pointer at the rim when the selected constellation is below the horizon */}
        {(() => {
          if (!selectedConstellation) return null;
          const c = constellations.find((x) => x.abbreviation === selectedConstellation);
          if (!c) return null;
          const verts = [...new Set(c.lines.flat())].map((id) => byId.get(id)?.horizontal).filter((h): h is HorizontalCoordinates => Boolean(h));
          const centre = meanDirection(verts);
          if (!centre || centre.altitude > 0) return null;
          const rim = proj({ altitude: 0, azimuth: centre.azimuth });
          const out = proj({ altitude: -4, azimuth: centre.azimuth });
          const label = proj({ altitude: -8, azimuth: centre.azimuth });
          return (
            <g className="chart-pointer">
              <line x1={rim.x} y1={rim.y} x2={out.x} y2={out.y} />
              <circle cx={rim.x} cy={rim.y} r={5} />
              <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle">
                {c.name} · below the horizon ({azimuthToCompass(centre.azimuth)}, {Math.round(-centre.altitude)}° down)
              </text>
            </g>
          );
        })()}
      </svg>
    </figure>
  );
}
