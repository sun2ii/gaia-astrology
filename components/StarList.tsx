"use client";

import { azimuthToCompass, describeAltitude } from "@/lib/astronomy/directions";
import type { VisibleStar } from "@/lib/astronomy/types";

type Props = {
  stars: VisibleStar[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function StarList({ stars, selectedId, onSelect }: Props) {
  if (stars.length === 0) {
    return <p className="empty">No catalog stars are above this altitude right now.</p>;
  }
  return (
    <ul className="star-list">
      {stars.map(({ star, horizontal }) => {
        const altitude = Math.round(horizontal.altitude);
        return (
          <li key={star.id}>
            <button
              type="button"
              className={`star-row${star.id === selectedId ? " selected" : ""}`}
              onClick={() => onSelect(star.id)}
              aria-pressed={star.id === selectedId}
            >
              <span className="star-name">{star.name ?? star.designation}</span>
              <span className="star-constellation">
                {star.constellationName}
                {star.name ? <> · {star.designation}</> : null}
              </span>
              <span className="star-mag">Magnitude {star.apparentMagnitude.toFixed(2)}</span>
              <span className="star-where">
                {azimuthToCompass(horizontal.azimuth)} · {altitude}° {describeAltitude(horizontal.altitude).label}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
