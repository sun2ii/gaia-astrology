/**
 * Core types for the Night Sky Explorer.
 *
 * Two kinds of data are kept deliberately separate:
 *
 *   CATALOG DATA (Star)        — fixed facts about a star, taken from published
 *                                 astronomical catalogs. Does not depend on who
 *                                 is looking, from where, or when.
 *
 *   CALCULATED FOR OBSERVER    — where that star appears in *your* sky right
 *   (HorizontalCoordinates,      now. Depends on observer latitude/longitude
 *    VisibleStar)                and on the date/time. Recomputed on demand.
 *
 * See DATA_SOURCES.md for where each catalog field comes from.
 */

/** A star as stored in data/stars.json. Catalog data only. */
export type Star = {
  /** Stable identifier, e.g. "hip-32349". */
  id: string;

  /** IAU-approved proper name (e.g. "Vega"), or null if the star has none. Never invented. */
  name: string | null;

  /**
   * Astronomical designation, e.g. "α Lyr", "61 Cyg", "HR 3017" or "HIP 12345".
   * Chosen in that order of preference (Bayer, Flamsteed, HR, HIP).
   */
  designation: string;

  /** Right ascension, ICRS, epoch J2000.0, in DECIMAL DEGREES [0, 360). */
  ra: number;

  /** Declination, ICRS, epoch J2000.0, in DECIMAL DEGREES [-90, +90]. */
  dec: number;

  /** Apparent visual magnitude (Johnson V). Lower = brighter. */
  apparentMagnitude: number;

  /**
   * "bright"  — one of the ~500 brightest stars (the learning set shown in the list).
   * "figure"  — fainter star included only because a constellation stick figure
   *             needs it as a vertex. Drawn on the chart, not listed.
   */
  tier: "bright" | "figure";

  /** IAU 3-letter constellation abbreviation, e.g. "Lyr". */
  constellation: string;

  /** Full constellation name (Latin), e.g. "Lyra". */
  constellationName: string;

  /** Distance in light-years (from Hipparcos parallax), only when reasonably reliable. */
  distanceLightYears?: number;

  /** Spectral type as given in the catalog, e.g. "A0V". */
  spectralType?: string;

  /** Cross-identifiers, kept for future data joins. */
  catalogIds: {
    hip: number;
    hd?: number;
    hr?: number;
  };
};

/** Where an observer stands on Earth. */
export type Observer = {
  /** Geographic latitude in decimal degrees, north positive [-90, +90]. */
  latitude: number;
  /** Geographic longitude in decimal degrees, east positive [-180, +180]. California is negative. */
  longitude: number;
};

/**
 * Horizontal (alt/az) coordinates, computed for a specific observer and instant.
 *
 * altitude: degrees above the horizon. 0 = horizon, 90 = straight up, negative = below horizon.
 * azimuth:  degrees clockwise from North. 0 = N, 90 = E, 180 = S, 270 = W. Range [0, 360).
 */
export type HorizontalCoordinates = {
  altitude: number;
  azimuth: number;
};

/** A catalog star together with where it is in the observer's sky right now. */
export type VisibleStar = {
  star: Star;
  horizontal: HorizontalCoordinates;
};

/** Metadata stored alongside the stars in data/stars.json. */
export type StarCatalogMeta = {
  generatedAt: string;
  starCount: number;
  brightStarCount: number;
  figureStarCount: number;
  cutoffMagnitude: number;
  coordinateSystem: string;
  sources: string[];
};

export type StarCatalog = {
  meta: StarCatalogMeta;
  stars: Star[];
};

/** A constellation stick figure. Catalog data (a drawing convention, not IAU-official). */
export type Constellation = {
  /** IAU 3-letter abbreviation, e.g. "Ori". */
  abbreviation: string;
  /** Latin name, e.g. "Orion". */
  name: string;
  /** English meaning, e.g. "The Hunter". */
  englishName: string;
  /**
   * Polylines to draw, each a list of star ids ("hip-NNNN"). Every id exists in
   * stars.json. Consecutive ids are joined by a line segment.
   */
  lines: string[][];
};

export type ConstellationCatalog = {
  meta: {
    generatedAt: string;
    constellationCount: number;
    source: string;
    license: string;
  };
  constellations: Constellation[];
};
