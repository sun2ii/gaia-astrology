/**
 * Loads the star and constellation catalogs. In V1/V2 these are static JSON
 * files bundled with the app; when the data model grows this module is the one
 * place to swap in a database or API.
 */
import constellationsJson from "@/data/constellations.json";
import catalogJson from "@/data/stars.json";
import type { Constellation, ConstellationCatalog, Star, StarCatalog, StarCatalogMeta } from "@/lib/astronomy/types";

const catalog = catalogJson as StarCatalog;
const constellationCatalog = constellationsJson as ConstellationCatalog;

/** Every star we know about: the bright learning set plus the figure-only stars. */
export const STARS: Star[] = catalog.stars;

/** The ~500 brightest stars — what the list shows and what "N / 508" counts. */
export const BRIGHT_STARS: Star[] = STARS.filter((s) => s.tier === "bright");

export const STAR_CATALOG_META: StarCatalogMeta = catalog.meta;

export const CONSTELLATIONS_WITH_FIGURES: Constellation[] = constellationCatalog.constellations;
export const CONSTELLATION_CATALOG_META = constellationCatalog.meta;

const starById = new Map(STARS.map((s) => [s.id, s]));
const constellationByAbbreviation = new Map(CONSTELLATIONS_WITH_FIGURES.map((c) => [c.abbreviation, c]));

export function getStarById(id: string): Star | undefined {
  return starById.get(id);
}

export function getConstellation(abbreviation: string): Constellation | undefined {
  return constellationByAbbreviation.get(abbreviation);
}
