import type { Observer } from "@/lib/astronomy/types";

/**
 * Default observer for V1: Orangevale, California.
 * The astronomy engine itself has no idea where California is — change these
 * numbers (or pass a different Observer) and everything works anywhere on Earth.
 */
export const DEFAULT_OBSERVER: Observer = {
  latitude: 38.67861,
  longitude: -121.22472,
};

export const DEFAULT_OBSERVER_LABEL = "Orangevale, California";

/** IANA time zone used to interpret the date/time controls. */
export const DEFAULT_TIME_ZONE = "America/Los_Angeles";
