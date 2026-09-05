"use client";

import { azimuthToCompass, meanDirection } from "@/lib/astronomy/directions";
import { ZODIAC_SYMBOLS } from "@/lib/astrology/types";
import { ZODIAC_CONSTELLATIONS, type ZodiacSky } from "@/lib/astrology/zodiacSky";
import { projectToDome, starDotRadius } from "@/lib/astronomy/projection";
import type { BodyPosition, SolarSystemBodyId } from "@/lib/astronomy/solarSystem";
import type { Constellation, HorizontalCoordinates, Star } from "@/lib/astronomy/types";

/** Which layers the chart draws. Presentation state only. */
export type ChartLayers = {
  stars: boolean;
  constellations: boolean;
  planets: boolean;
  /** Names on the chart: bright-star names, constellation names, planet names. */
  labels: boolean;
  /** The ecliptic with the twelve sign slices, and the zodiac constellations highlighted. */
  zodiac: boolean;
};

export const DEFAULT_LAYERS: ChartLayers = { stars: true, constellations: true, planets: true, labels: false, zodiac: false };

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
  /** Ecliptic + sign boundaries for this observer/instant (drawn when layers.zodiac). */
  zodiacSky: ZodiacSky;
  selection: ChartSelection;
  onSelectStar: (id: string) => void;
  onSelectConstellation: (abbreviation: string) => void;
  onSelectBody: (id: SolarSystemBodyId) => void;
};

const R = 300; // chart radius in SVG units
const MARGIN = 28; // room for the compass letters
const LABEL_MAGNITUDE = 1.6; // stars brighter than this get a permanent name label

/** Segments whose ends are both this far below the horizon are not drawn at all. */
const LINE_CUTOFF_ALTITUDE = -8;

export function SkyChart({ positions, constellations, colors, bodies, layers, zodiacSky, selection, onSelectStar, onSelectConstellation, onSelectBody }: Props) {
  const byId = new Map(positions.map((p) => [p.star.id, p]));
  const selectedConstellation =
    selection?.kind === "constellation"
      ? selection.abbreviation
      : selection?.kind === "star"
        ? byId.get(selection.id)?.star.constellation ?? null
        : null;

  const size = (R + MARGIN) * 2;

  return (
    <figure className="chart">
      <svg
        viewBox={`${-(R + MARGIN)} ${-(R + MARGIN)} ${size} ${size}`}
        role="img"
        aria-label="Sky chart: zenith at the centre, horizon at the rim, north at the top"
      >
        <defs>
          <clipPath id="horizon-clip">
            <circle cx={0} cy={0} r={R} />
          </clipPath>
        </defs>

        {/* Dome background and altitude rings */}
        <circle className="chart-sky" cx={0} cy={0} r={R} />
        {[30, 60].map((alt) => (
          <circle key={alt} className="chart-ring" cx={0} cy={0} r={((90 - alt) / 90) * R} />
        ))}
        <line className="chart-ring" x1={-R} y1={0} x2={R} y2={0} />
        <line className="chart-ring" x1={0} y1={-R} x2={0} y2={R} />
        <text className="chart-ring-label" x={4} y={-((90 - 30) / 90) * R - 3}>
          30°
        </text>
        <text className="chart-ring-label" x={4} y={-((90 - 60) / 90) * R - 3}>
          60°
        </text>

        {/* Compass points. East is on the LEFT because we are looking up. */}
        {[
          ["N", 0],
          ["E", 90],
          ["S", 180],
          ["W", 270],
        ].map(([label, az]) => {
          const p = projectToDome({ altitude: -6, azimuth: az as number }, R);
          return (
            <text key={label} className="chart-compass" x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle">
              {label}
            </text>
          );
        })}
        {[45, 135, 225, 315].map((az) => {
          const p = projectToDome({ altitude: -5, azimuth: az }, R);
          return (
            <text key={az} className="chart-compass-minor" x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle">
              {azimuthToCompass(az)}
            </text>
          );
        })}

        <g clipPath="url(#horizon-clip)">
          {/* The zodiac: the ecliptic and the twelve sign slices along it */}
          {layers.zodiac ? (
            <g className="chart-zodiac">
              {zodiacSky.ecliptic.map((pt, i) => {
                if (i === 0) return null;
                const prev = zodiacSky.ecliptic[i - 1];
                if (pt.horizontal.altitude < LINE_CUTOFF_ALTITUDE && prev.horizontal.altitude < LINE_CUTOFF_ALTITUDE) return null;
                const a = projectToDome(prev.horizontal, R);
                const b = projectToDome(pt.horizontal, R);
                return <line key={i} className="chart-ecliptic" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
              })}
              {zodiacSky.signs.map(({ sign, start, middle }) => {
                const s = projectToDome(start, R);
                const m = projectToDome(middle, R);
                return (
                  <g key={sign} className="chart-sign">
                    {start.altitude > LINE_CUTOFF_ALTITUDE ? <circle className="chart-sign-tick" cx={s.x} cy={s.y} r={3.5} /> : null}
                    {middle.altitude > 0 ? (
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
            const segments: Array<[number, number, number, number]> = [];
            const visibleVertices: Array<{ x: number; y: number }> = [];
            for (const line of c.lines) {
              for (let i = 0; i < line.length; i++) {
                const a = byId.get(line[i]);
                if (!a) continue;
                if (a.horizontal.altitude > 0) visibleVertices.push(projectToDome(a.horizontal, R));
                if (i === 0) continue;
                const b = byId.get(line[i - 1]);
                if (!b) continue;
                if (a.horizontal.altitude < LINE_CUTOFF_ALTITUDE && b.horizontal.altitude < LINE_CUTOFF_ALTITUDE) continue;
                const pa = projectToDome(a.horizontal, R);
                const pb = projectToDome(b.horizontal, R);
                segments.push([pb.x, pb.y, pa.x, pa.y]);
              }
            }
            if (segments.length === 0) return null;
            const isSelected = c.abbreviation === selectedConstellation;
            const isZodiac = ZODIAC_CONSTELLATIONS.has(c.abbreviation);
            const dimmed = (selectedConstellation !== null && !isSelected) || (layers.zodiac && !isZodiac && !isSelected);
            const emphasised = layers.zodiac && isZodiac && !dimmed;
            const color = colors.get(c.abbreviation) ?? "#8d95a8";
            const label =
              visibleVertices.length >= 2
                ? {
                    x: visibleVertices.reduce((s, p) => s + p.x, 0) / visibleVertices.length,
                    y: visibleVertices.reduce((s, p) => s + p.y, 0) / visibleVertices.length,
                  }
                : null;
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
                {segments.map(([x1, y1, x2, y2], i) => (
                  <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
                ))}
                {/* wider invisible hit area so thin lines are easy to click */}
                {segments.map(([x1, y1, x2, y2], i) => (
                  <line key={`hit-${i}`} className="chart-hit" x1={x1} y1={y1} x2={x2} y2={y2} />
                ))}
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
          {[...positions]
            .filter((p) => p.horizontal.altitude > 0)
            .filter((p) => (layers.stars ? true : layers.constellations && p.star.tier === "figure"))
            .sort((a, b) => b.star.apparentMagnitude - a.star.apparentMagnitude)
            .map(({ star, horizontal }) => {
              const p = projectToDome(horizontal, R);
              const r = starDotRadius(star.apparentMagnitude, R);
              const isSelected = selection?.kind === "star" && selection.id === star.id;
              const showLabel = star.name && ((layers.labels && star.apparentMagnitude < LABEL_MAGNITUDE) || isSelected);
              return (
                <g
                  key={star.id}
                  className={`chart-star ${star.tier}${isSelected ? " selected" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectStar(star.id);
                  }}
                  role="button"
                  tabIndex={star.tier === "bright" ? 0 : -1}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") onSelectStar(star.id);
                  }}
                >
                  <title>
                    {star.name ?? star.designation} · {star.constellationName} · mag {star.apparentMagnitude.toFixed(2)} ·{" "}
                    {azimuthToCompass(horizontal.azimuth)} {Math.round(horizontal.altitude)}°
                  </title>
                  <circle className="chart-hit" cx={p.x} cy={p.y} r={Math.max(r + 5, 7)} />
                  <circle cx={p.x} cy={p.y} r={r} />
                  {showLabel ? (
                    <text className="chart-star-label" x={p.x + r + 3} y={p.y - r - 2}>
                      {star.name}
                    </text>
                  ) : null}
                </g>
              );
            })}

          {/* Sun, Moon and planets */}
          {layers.planets && bodies
            .filter((b) => b.horizontal.altitude > 0)
            .map((b) => {
              const p = projectToDome(b.horizontal, R);
              const isSelected = selection?.kind === "body" && selection.id === b.id;
              const r = b.id === "sun" ? 9 : b.id === "moon" ? 7 : 4.5;
              return (
                <g
                  key={b.id}
                  className={`chart-body ${b.id}${isSelected ? " selected" : ""}`}
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
        </g>

        <circle className="chart-horizon" cx={0} cy={0} r={R} />

        {/* Pointer at the rim when the selected constellation is below the horizon */}
        {(() => {
          if (!selectedConstellation) return null;
          const c = constellations.find((x) => x.abbreviation === selectedConstellation);
          if (!c) return null;
          const verts = [...new Set(c.lines.flat())].map((id) => byId.get(id)?.horizontal).filter((h): h is HorizontalCoordinates => Boolean(h));
          const centre = meanDirection(verts);
          if (!centre || centre.altitude > 0) return null;
          const rim = projectToDome({ altitude: 0, azimuth: centre.azimuth }, R);
          const out = projectToDome({ altitude: -4, azimuth: centre.azimuth }, R);
          const label = projectToDome({ altitude: -8, azimuth: centre.azimuth }, R);
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
