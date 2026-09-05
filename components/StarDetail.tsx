"use client";

import Link from "next/link";
import { azimuthToCompass, describeWhereToLook } from "@/lib/astronomy/directions";
import { isAboveHorizon } from "@/lib/astronomy/visibility";
import type { HorizontalCoordinates, Star } from "@/lib/astronomy/types";

type Props = {
  star: Star;
  horizontal: HorizontalCoordinates;
  constellationColor?: string;
  onSelectConstellation?: (abbreviation: string) => void;
  onClose: () => void;
};

function formatDistance(ly: number): string {
  return `~${ly.toLocaleString(undefined, { maximumFractionDigits: ly < 100 ? 1 : 0 })} light-years`;
}

/**
 * Two clearly separated sections:
 *   catalog facts (same for everyone, from the star catalogs), and
 *   "right now" numbers (computed for this observer and instant).
 */
export function StarDetail({ star, horizontal, constellationColor, onSelectConstellation, onClose }: Props) {
  const above = isAboveHorizon(horizontal.altitude);
  const azimuth = Math.round(horizontal.azimuth) % 360;
  const altitude = Math.round(horizontal.altitude);

  return (
    <aside className="detail" aria-label="Star detail">
      <div className="detail-header">
        <h2>{star.name ? star.name.toUpperCase() : star.designation}</h2>
        <button type="button" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      {star.name ? <p className="detail-designation">{star.designation}</p> : null}

      <dl>
        <dt>Constellation</dt>
        <dd>
          {onSelectConstellation ? (
            <button type="button" className="link-button" onClick={() => onSelectConstellation(star.constellation)}>
              <span className="detail-swatch" style={{ "--constellation-color": constellationColor } as React.CSSProperties} />
              {star.constellationName}
            </button>
          ) : (
            star.constellationName
          )}
        </dd>

        <dt>Brightness</dt>
        <dd>Magnitude {star.apparentMagnitude.toFixed(2)}</dd>

        {star.distanceLightYears !== undefined ? (
          <>
            <dt>Distance</dt>
            <dd>{formatDistance(star.distanceLightYears)}</dd>
          </>
        ) : null}

        {star.spectralType ? (
          <>
            <dt>Spectral type</dt>
            <dd>{star.spectralType}</dd>
          </>
        ) : null}

        <dt>Catalog IDs</dt>
        <dd>
          HIP {star.catalogIds.hip}
          {star.catalogIds.hr !== undefined ? ` · HR ${star.catalogIds.hr}` : ""}
          {star.catalogIds.hd !== undefined ? ` · HD ${star.catalogIds.hd}` : ""}
        </dd>
      </dl>

      <h3>Right now</h3>
      {above ? (
        <>
          <dl>
            <dt>Direction</dt>
            <dd>{azimuthToCompass(horizontal.azimuth)}</dd>
            <dt>Azimuth</dt>
            <dd>{azimuth}°</dd>
            <dt>Altitude</dt>
            <dd>{altitude}°</dd>
          </dl>
          <p className="detail-instruction">{describeWhereToLook(horizontal.azimuth, horizontal.altitude)}</p>
        </>
      ) : (
        <p className="detail-instruction">Below the horizon right now ({altitude}°). Try a different time.</p>
      )}

      <Link className="read-more" href={`/learn/stars/${star.id}`}>
        Read the full page for {star.name ?? star.designation} →
      </Link>

      <p className="detail-note">
        Constellation, brightness, distance and spectral type are catalog data. Direction, azimuth and altitude
        are calculated for your location and time.
      </p>
    </aside>
  );
}
