/**
 * Small helpers for the date/time controls and the time bar.
 *
 * The app interprets the date and time fields in the BROWSER'S time zone (for a
 * Californian on a Californian laptop that is Pacific time). When the app is
 * used for observers in other time zones this is the module to extend.
 */

export const MINUTE_MS = 60_000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;

/**
 * One rotation of the Earth relative to the stars: 23h 56m 4.09s. Step the
 * clock by exactly this and every star comes back to the same spot in the sky.
 * A solar day (24h) is ~3m 56s longer, which is why the sky drifts ~1°/day.
 */
export const SIDEREAL_DAY_MS = 86_164_090.5;

/** Step sizes offered by the time bar. */
export const TIME_STEPS: Array<{ label: string; ms: number }> = [
  { label: "10 minutes", ms: 10 * MINUTE_MS },
  { label: "1 hour", ms: HOUR_MS },
  { label: "1 day", ms: DAY_MS },
  { label: "1 sidereal day (23h 56m)", ms: SIDEREAL_DAY_MS },
  { label: "1 week", ms: 7 * DAY_MS },
  { label: "1 month (30 days)", ms: 30 * DAY_MS },
];

/** Playback speeds: how many simulated seconds pass per real second. */
export const PLAY_SPEEDS: Array<{ label: string; factor: number }> = [
  { label: "real time", factor: 1 },
  { label: "1 min / s", factor: 60 },
  { label: "10 min / s", factor: 600 },
  { label: "1 hour / s", factor: 3600 },
  { label: "1 day / s", factor: 86_400 },
];

/** "2026-09-03" for an <input type="date">, in local time. */
export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "21:30" for an <input type="time">, in local time. */
export function toTimeInputValue(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${min}`;
}

/** Combines "2026-09-03" + "21:30" (local time) into a Date. Returns null if either is invalid. */
export function fromDateAndTimeInputs(dateValue: string, timeValue: string): Date | null {
  const [y, m, d] = dateValue.split("-").map(Number);
  const [h, min] = timeValue.split(":").map(Number);
  if ([y, m, d, h, min].some((n) => !Number.isFinite(n))) return null;
  const date = new Date(y, m - 1, d, h, min, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatLongDate(date: Date): string {
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function localTimeZoneName(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "local time";
  }
}

/* ---------- Time zones (for birth times) ---------- */

/**
 * A birth time is a LOCAL time at the birth place: "9:30 AM in Sacramento" and
 * "9:30 AM in New York" are different instants. To turn a local wall-clock time
 * in a named zone into a real instant we use the browser's Intl database.
 */
export const COMMON_TIME_ZONES = [
  "America/Los_Angeles",
  "America/Denver",
  "America/Phoenix",
  "America/Chicago",
  "America/New_York",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Africa/Johannesburg",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Jakarta",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
  "UTC",
] as const;

/** Offset of `zone` from UTC at `utcMs`, in minutes (east positive). */
export function timeZoneOffsetMinutes(utcMs: number, zone: string): number {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date(utcMs)).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  );
  return Math.round((asUtc - utcMs) / MINUTE_MS);
}

/**
 * Local wall-clock time in `zone` -> instant. Handles DST by iterating on the
 * offset. Returns null for an invalid zone.
 */
export function zonedLocalToUtc(
  parts: { year: number; month: number; day: number; hour: number; minute: number },
  zone: string,
): Date | null {
  try {
    const guess = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0);
    let utc = guess - timeZoneOffsetMinutes(guess, zone) * MINUTE_MS;
    utc = guess - timeZoneOffsetMinutes(utc, zone) * MINUTE_MS;
    return new Date(utc);
  } catch {
    return null;
  }
}
