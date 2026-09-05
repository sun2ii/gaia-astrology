"use client";

import { azimuthToCompass, compassToWords, describeAltitude, meanDirection } from "@/lib/astronomy/directions";
import type { Constellation, HorizontalCoordinates, Star } from "@/lib/astronomy/types";
import { isAboveHorizon, sortByBrightness } from "@/lib/astronomy/visibility";

type Props = {
  constellation: Constellation;
  color?: string;
  /** Positions of every catalog star, so we can find this constellation's members. */
  positions: Array<{ star: Star; horizontal: HorizontalCoordinates }>;
  onSelectStar: (id: string) => void;
  onClose: () => void;
};

export function ConstellationDetail({ constellation, color, positions, onSelectStar, onClose }: Props) {
  const members = positions.filter((p) => p.star.constellation === constellation.abbreviation);
  const brightMembers = sortByBrightness(members.filter((p) => p.star.tier === "bright"));
  const figureIds = new Set(constellation.lines.flat());
  const figureUp = members.filter((p) => figureIds.has(p.star.id) && isAboveHorizon(p.horizontal.altitude));
  const figureTotal = figureIds.size;
  const centre = meanDirection(figureUp.map((p) => p.horizontal));

  const altitudes = figureUp.map((p) => p.horizontal.altitude);
  const lowest = altitudes.length ? Math.round(Math.min(...altitudes)) : null;
  const highest = altitudes.length ? Math.round(Math.max(...altitudes)) : null;

  return (
    <aside className="detail" aria-label="Constellation detail">
      <div className="detail-header">
        <h2>
          <span className="detail-swatch" style={{ "--constellation-color": color } as React.CSSProperties} />
          {constellation.name.toUpperCase()}
        </h2>
        <button type="button" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <p className="detail-designation">
        {constellation.englishName} · {constellation.abbreviation}
      </p>

      <h3>Right now</h3>
      {centre && figureUp.length > 0 ? (
        <>
          <dl>
            <dt>Direction</dt>
            <dd>{azimuthToCompass(centre.azimuth)}</dd>
            <dt>Altitude</dt>
            <dd>
              {lowest === highest ? `${highest}°` : `${lowest}°–${highest}°`} ({describeAltitude(centre.altitude).label})
            </dd>
            <dt>Figure</dt>
            <dd>
              {figureUp.length} of {figureTotal} stars above the horizon
            </dd>
          </dl>
          <p className="detail-instruction">
            {centre.altitude >= 80
              ? "Look nearly straight overhead."
              : `Face ${compassToWords(azimuthToCompass(centre.azimuth))} and look ${describeAltitude(centre.altitude).phrase}.`}
          </p>
        </>
      ) : (
        <p className="detail-instruction">Below the horizon right now. Try a different time.</p>
      )}

      <h3>Brightest stars</h3>
      {brightMembers.length === 0 ? (
        <p className="detail-note">None of the {"~500"} brightest stars lie in this constellation.</p>
      ) : (
        <ul className="member-list">
          {brightMembers.map(({ star, horizontal }) => {
            const up = isAboveHorizon(horizontal.altitude);
            return (
              <li key={star.id}>
                <button type="button" className="member-row" onClick={() => onSelectStar(star.id)}>
                  <span>
                    {star.name ?? star.designation}
                    {star.name ? <small> {star.designation}</small> : null}
                  </span>
                  <span className="member-where">
                    {up ? `${azimuthToCompass(horizontal.azimuth)} · ${Math.round(horizontal.altitude)}°` : "below horizon"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p className="detail-note">
        The stick figure is a drawing convention (Stellarium&rsquo;s modern sky culture), not an IAU standard. Membership
        uses the official IAU boundaries. Direction and altitude are calculated for your location and time.
      </p>
    </aside>
  );
}
