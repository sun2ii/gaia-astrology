"use client";

import { azimuthToCompass, describeWhereToLook } from "@/lib/astronomy/directions";
import { BODY_INFO, type BodyPosition } from "@/lib/astronomy/solarSystem";
import { isAboveHorizon } from "@/lib/astronomy/visibility";
import type { Aspect, PlanetPlacement } from "@/lib/astrology/types";
import { ZODIAC_SYMBOLS } from "@/lib/astrology/types";
import { formatZodiacPosition } from "@/lib/astrology/zodiac";

type Props = {
  body: BodyPosition;
  placement: PlanetPlacement;
  aspects: Aspect[];
  onSelectBody: (id: BodyPosition["id"]) => void;
  onSelectConstellation?: (abbreviation: string) => void;
  onClose: () => void;
};

/**
 * One solar-system body, shown two ways:
 *   ASTRONOMY — where it physically is (for this observer, right now)
 *   ASTROLOGY — the same longitude re-labelled on the tropical zodiac
 */
export function BodyDetail({ body, placement, aspects, onSelectBody, onSelectConstellation, onClose }: Props) {
  const above = isAboveHorizon(body.horizontal.altitude);
  const altitude = Math.round(body.horizontal.altitude);
  const azimuth = Math.round(body.horizontal.azimuth) % 360;
  const mine = aspects.filter((a) => a.bodies.includes(body.id));

  return (
    <aside className="detail" aria-label="Solar system body detail">
      <div className="detail-header">
        <h2>
          <span className="body-symbol">{body.symbol}</span> {body.name.toUpperCase()}
        </h2>
        <button type="button" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <h3>Astronomy</h3>
      <dl>
        <dt>Constellation</dt>
        <dd>
          {onSelectConstellation ? (
            <button type="button" className="link-button" onClick={() => onSelectConstellation(body.constellation)}>
              {body.constellationName}
            </button>
          ) : (
            body.constellationName
          )}
        </dd>
        <dt>Brightness</dt>
        <dd>Magnitude {body.apparentMagnitude.toFixed(1)}</dd>
        {body.id === "moon" || body.id === "mercury" || body.id === "venus" ? (
          <>
            <dt>Illuminated</dt>
            <dd>{Math.round(body.illuminatedFraction * 100)}%</dd>
          </>
        ) : null}
        <dt>Ecliptic longitude</dt>
        <dd>{body.eclipticLongitude.toFixed(2)}°</dd>
        {above ? (
          <>
            <dt>Direction</dt>
            <dd>{azimuthToCompass(body.horizontal.azimuth)}</dd>
            <dt>Azimuth</dt>
            <dd>{azimuth}°</dd>
            <dt>Altitude</dt>
            <dd>{altitude}°</dd>
          </>
        ) : null}
      </dl>
      <p className="detail-instruction">
        {above ? describeWhereToLook(body.horizontal.azimuth, body.horizontal.altitude) : `Below the horizon right now (${altitude}°).`}
      </p>

      <h3>Astrology (tropical zodiac)</h3>
      <dl>
        <dt>Sign</dt>
        <dd>
          <span className="zodiac-symbol">{ZODIAC_SYMBOLS[placement.zodiac.sign]}</span> {formatZodiacPosition(placement.zodiac)}
        </dd>
        <dt>Motion</dt>
        <dd>
          {placement.retrograde ? "Retrograde ℞" : "Direct"} · {Math.abs(placement.speed).toFixed(2)}°/day
        </dd>
      </dl>
      {mine.length > 0 ? (
        <ul className="member-list">
          {mine.map((a) => {
            const other = a.bodies[0] === body.id ? a.bodies[1] : a.bodies[0];
            return (
              <li key={`${a.name}-${other}`}>
                <button type="button" className="member-row" onClick={() => onSelectBody(other)}>
                  <span>
                    {body.symbol} {a.symbol} {BODY_INFO[other].symbol} {body.name} {a.name} {BODY_INFO[other].name}
                  </span>
                  <span className="member-where">
                    orb {a.orb.toFixed(1)}° · {a.applying ? "applying" : "separating"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="detail-note">No major aspects within orb right now.</p>
      )}

      <p className="detail-note">
        Constellation and sign can differ: the constellation is where the {body.name} physically sits among the stars; the
        sign is its position on the tropical zodiac, which starts at the March-equinox point and has drifted ~24° from the
        constellations since the zodiac was defined. Astrology values are a symbolic re-labelling of the same measurement,
        not a separate observation.
      </p>
    </aside>
  );
}
