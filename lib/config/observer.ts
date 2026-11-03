import type { Observer } from "@/lib/astronomy/types";

/**
 * Default observer: New York City.
 * The astronomy engine itself has no idea where New York is — change these
 * numbers (or pass a different Observer) and everything works anywhere on Earth.
 */
export const DEFAULT_OBSERVER: Observer = {
  latitude: 40.7128,
  longitude: -74.006,
};

export const DEFAULT_OBSERVER_LABEL = "New York City";

/** IANA time zone used to interpret the date/time controls. */
export const DEFAULT_TIME_ZONE = "America/New_York";
