"use client";

import { useState } from "react";
import { Term } from "@/components/Term";
import { BODY_INFO, type BodyPosition } from "@/lib/astronomy/solarSystem";
import type { AstrologyState } from "@/lib/astrology/types";
import { ZODIAC_SYMBOLS } from "@/lib/astrology/types";
import { formatZodiacPosition } from "@/lib/astrology/zodiac";

type Props = {
  state: AstrologyState;
  bodies: BodyPosition[];
  onSelectBody: (id: BodyPosition["id"]) => void;
};

/**
 * "Today's sky", astrology view. Compact by default: the Sun and Moon (the
 * two everyone feels day to day) plus any planet currently retrograde.
 * "Show all" reveals the full placements table and the aspect list.
 */
export function AstrologyPanel({ state, bodies, onSelectBody }: Props) {
  const [showAll, setShowAll] = useState(false);
  const byId = new Map(bodies.map((b) => [b.id, b]));
  const byBody = new Map(state.planets.map((p) => [p.body, p]));
  const sun = byBody.get("sun")!;
  const moon = byBody.get("moon")!;
  const retro = state.planets.filter((p) => p.retrograde);

  return (
    <section className="astrology">
      <div>
        <div className="big-three">
          <div className="big-card">
            <span className="big-label">☉ Sun today</span>
            <button type="button" className="link-button big-value" onClick={() => onSelectBody("sun")}>
              {ZODIAC_SYMBOLS[sun.zodiac.sign]} {sun.zodiac.sign}
            </button>
            <span className="muted">{Math.floor(sun.zodiac.degree)}° in · the season&rsquo;s mood</span>
          </div>
          <div className="big-card">
            <span className="big-label">☽ Moon today</span>
            <button type="button" className="link-button big-value" onClick={() => onSelectBody("moon")}>
              {ZODIAC_SYMBOLS[moon.zodiac.sign]} {moon.zodiac.sign}
            </button>
            <span className="muted">changes every 2–3 days · the day&rsquo;s mood</span>
          </div>
          <div className="big-card">
            <span className="big-label">
              <Term k="retrograde">Retrograde</Term> now
            </span>
            {retro.length === 0 ? (
              <span className="muted">none — everything moving forward</span>
            ) : (
              <span className="big-value">{retro.map((p) => BODY_INFO[p.body].symbol).join(" ")}</span>
            )}
            {retro.length > 0 ? <span className="muted">{retro.map((p) => BODY_INFO[p.body].name).join(", ")}</span> : null}
          </div>
        </div>
        <p className="detail-note">
          This is today&rsquo;s sky, not your chart. Each planet is shown by its <Term k="zodiac">zodiac</Term> sign — the
          same physical position the star chart uses, just measured against the equinox instead of the stars.
        </p>
        <div className="deeper">
          <button type="button" className="toggle" onClick={() => setShowAll((s) => !s)} aria-expanded={showAll}>
            {showAll ? "Show less" : "Show all planets and aspects"}
          </button>
        </div>
      </div>

      {showAll ? (
        <>
          <div>
            <p className="eyebrow">ALL PLACEMENTS · TROPICAL ZODIAC</p>
            <table className="placements">
              <thead>
                <tr>
                  <th>Body</th>
                  <th>Sign</th>
                  <th>Motion</th>
                  <th>Constellation</th>
                  <th>Sky</th>
                </tr>
              </thead>
              <tbody>
                {state.planets.map((p) => {
                  const b = byId.get(p.body)!;
                  const up = b.horizontal.altitude > 0;
                  return (
                    <tr key={p.body} onClick={() => onSelectBody(p.body)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onSelectBody(p.body)}>
                      <td>
                        <span className="body-symbol">{BODY_INFO[p.body].symbol}</span> {BODY_INFO[p.body].name}
                      </td>
                      <td>
                        <span className="zodiac-symbol">{ZODIAC_SYMBOLS[p.zodiac.sign]}</span> {formatZodiacPosition(p.zodiac)}
                      </td>
                      <td className={p.retrograde ? "retro" : ""}>{p.retrograde ? "℞ retrograde" : "direct"}</td>
                      <td className="muted">{b.constellationName}</td>
                      <td className="muted">{up ? `up · ${Math.round(b.horizontal.altitude)}°` : "below horizon"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="detail-note">
              The Sign and Constellation columns differ by about one sign: the zodiac&rsquo;s starting point has drifted ~24°
              from the constellations since it was defined. Both are correct; they measure from different places.
            </p>
          </div>

          <div>
            <p className="eyebrow">
              CURRENT <Term k="aspect">ASPECTS</Term>
            </p>
            {state.aspects.length === 0 ? (
              <p className="empty">No major aspects within orb.</p>
            ) : (
              <ul className="aspect-list">
                {state.aspects.map((a) => (
                  <li key={`${a.bodies[0]}-${a.name}-${a.bodies[1]}`}>
                    <span className="aspect-glyphs">
                      {BODY_INFO[a.bodies[0]].symbol} {a.symbol} {BODY_INFO[a.bodies[1]].symbol}
                    </span>
                    <span>
                      {BODY_INFO[a.bodies[0]].name} {a.name} {BODY_INFO[a.bodies[1]].name}
                    </span>
                    <span className="muted">
                      {a.orb.toFixed(1)}° <Term k="orb">orb</Term> · {a.applying ? "applying" : "separating"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
