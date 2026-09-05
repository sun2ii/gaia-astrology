/**
 * Ecliptic longitude -> tropical zodiac sign + degree.
 *
 * The tropical zodiac divides the ecliptic into twelve 30° signs starting at
 * the vernal equinox point *of date* (where the Sun is at the March equinox).
 * Because that point drifts westward against the stars by ~1° every 72 years
 * (precession), the signs no longer coincide with the constellations of the
 * same name — today they are offset by roughly 24°. The Sun can be in the
 * constellation Leo while at "Virgo 11°". Both statements are true; they
 * measure against different reference points.
 */
import { ZODIAC_SIGNS, type ZodiacPosition } from "./types";

export const SIGN_WIDTH_DEG = 30;

export function normalizeLongitude(longitude: number): number {
  return ((longitude % 360) + 360) % 360;
}

export function zodiacPosition(longitude: number): ZodiacPosition {
  const normalized = normalizeLongitude(longitude);
  const signIndex = Math.floor(normalized / SIGN_WIDTH_DEG) % ZODIAC_SIGNS.length;
  return {
    sign: ZODIAC_SIGNS[signIndex],
    degree: normalized - signIndex * SIGN_WIDTH_DEG,
    longitude: normalized,
  };
}

/** "Virgo 11°24′" style label. */
export function formatZodiacPosition(p: ZodiacPosition, withMinutes = true): string {
  if (!withMinutes) return `${p.sign} ${Math.floor(p.degree)}°`;
  // Round to the nearest arcminute, carrying 60′ into the degree (29°60′ -> 30° stays within the sign label).
  let totalMinutes = Math.round(p.degree * 60);
  if (totalMinutes >= 30 * 60) totalMinutes = 30 * 60 - 1;
  const whole = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${p.sign} ${whole}°${String(minutes).padStart(2, "0")}′`;
}
