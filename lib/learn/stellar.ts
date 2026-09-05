/**
 * Turns catalog numbers into a plain-English portrait of a star.
 *
 * Everything here is textbook stellar astronomy applied to the catalog fields
 * (spectral type, magnitude, distance). No star-specific facts are stored or
 * invented; each result says which rule produced it.
 *
 * Spectral type, e.g. "K1.5III" or "A0Vvar":
 *   letter  O B A F G K M   = surface temperature (O hottest, M coolest) and colour
 *   digit   0–9             = finer step within the letter (0 hottest)
 *   Roman   I II III IV V   = luminosity class: I supergiant, II bright giant,
 *                             III giant, IV subgiant, V main-sequence ("dwarf")
 *   suffixes (var, p, e, n, m, SB…) = peculiarities; we mention a few.
 */
import { createSkyFrame, toHorizontal } from "@/lib/astronomy/coordinates";
import type { Observer, Star } from "@/lib/astronomy/types";

export type SpectralClass = "O" | "B" | "A" | "F" | "G" | "K" | "M";

/** Approximate surface temperatures (kelvin) at subclass 0 and 9, per class. Standard textbook ranges. */
const TEMPERATURE_RANGE: Record<SpectralClass, [number, number]> = {
  O: [45_000, 30_000],
  B: [30_000, 10_000],
  A: [10_000, 7_500],
  F: [7_500, 6_000],
  G: [6_000, 5_200],
  K: [5_200, 3_700],
  M: [3_700, 2_400],
};

const CLASS_COLOUR: Record<SpectralClass, { colour: string; hex: string; note: string }> = {
  O: { colour: "blue", hex: "#9bb0ff", note: "the hottest and rarest kind of star, burning through its fuel in a few million years" },
  B: { colour: "blue-white", hex: "#aabfff", note: "very hot, very bright, and short-lived by stellar standards — tens of millions of years" },
  A: { colour: "white", hex: "#cad7ff", note: "hot white stars like Sirius and Vega, living around a billion years" },
  F: { colour: "yellow-white", hex: "#f8f7ff", note: "a little hotter and bigger than the Sun, living a few billion years" },
  G: { colour: "yellow", hex: "#fff4ea", note: "Sun-like stars, living around ten billion years" },
  K: { colour: "orange", hex: "#ffd2a1", note: "cooler and dimmer than the Sun as dwarfs, but many bright K stars are old giants" },
  M: { colour: "red", hex: "#ffcc6f", note: "the coolest class; as dwarfs they are the most common stars in the galaxy, as giants and supergiants they are enormous" },
};

export type LuminosityClass = "Ia0" | "Ia" | "Iab" | "Ib" | "I" | "II" | "III" | "IV" | "V" | "VI";

const CLASS_STAGE: Record<LuminosityClass, { stage: string; explain: string }> = {
  Ia0: { stage: "hypergiant", explain: "an extremely rare, extremely luminous star near the upper limit of what a star can be" },
  Ia: { stage: "luminous supergiant", explain: "a massive star that has left the main sequence and swollen enormously; it will end as a supernova" },
  Iab: { stage: "supergiant", explain: "a massive star that has left the main sequence and swollen enormously; it will end as a supernova" },
  Ib: { stage: "supergiant", explain: "a massive star that has left the main sequence and swollen enormously; it will end as a supernova" },
  I: { stage: "supergiant", explain: "a massive star that has left the main sequence and swollen enormously; it will end as a supernova" },
  II: { stage: "bright giant", explain: "a star in a late, swollen stage of life, between giant and supergiant in size" },
  III: { stage: "giant", explain: "a star that has used up the hydrogen in its core and puffed up to many times its former size — the Sun's future in about five billion years" },
  IV: { stage: "subgiant", explain: "a star just beginning to leave the main sequence and expand" },
  V: { stage: "main-sequence star", explain: "a star in the long, stable middle of its life, fusing hydrogen in its core like the Sun does now" },
  VI: { stage: "subdwarf", explain: "a dim, metal-poor star below the main sequence" },
};

export type SpectralDecode = {
  raw: string;
  class?: SpectralClass;
  subclass?: number;
  luminosity?: LuminosityClass;
  colour?: string;
  colourHex?: string;
  temperatureK?: number;
  stage?: string;
  /** Plain-English paragraph. */
  summary: string;
  /** Any peculiarity flags found, explained. */
  notes: string[];
};

const PECULIARITIES: Array<[RegExp, string]> = [
  [/var/i, "marked as variable: its brightness changes over time"],
  [/\bSB\b/, "a spectroscopic binary: two stars too close to separate, revealed by shifting lines in the spectrum"],
  [/\bp\b|p(?=[A-Z]|$)/, "flagged 'peculiar': unusual chemical lines in its spectrum"],
  [/\be\b|e(?=[A-Z]|$)/, "flagged 'e': emission lines, often from a disc or shell of gas around the star"],
  [/\bm\b|m(?=[A-Z.]|$)/, "flagged 'm': strong metal lines in its spectrum"],
  [/\bn\b|n(?=[A-Z]|$)/, "flagged 'n': broad, 'nebulous' lines, usually from fast rotation"],
  [/comp/i, "a composite spectrum: light from two different stars mixed together"],
];

export function decodeSpectralType(raw: string | undefined): SpectralDecode {
  if (!raw) return { raw: "", summary: "No spectral type is recorded for this star in the catalog.", notes: [] };
  const m = /^([OBAFGKM])(\d(?:\.\d)?)?:?\s*(?:[-/][OBAFGKM]?\d(?:\.\d)?)?:?\s*(Ia0|Iab|Ia|Ib|III|II|IV|VI|V|I)?/.exec(raw.trim());
  const notes = PECULIARITIES.filter(([re]) => re.test(raw)).map(([, text]) => text);
  if (!m) {
    return { raw, summary: `The catalog spectral type is "${raw}", which does not fit the standard OBAFGKM pattern (it may be a carbon star, a Wolf–Rayet star, or an unusual object).`, notes };
  }
  const cls = m[1] as SpectralClass;
  const sub = m[2] !== undefined ? Number(m[2]) : undefined;
  const lum = m[3] as LuminosityClass | undefined;
  const [t0, t9] = TEMPERATURE_RANGE[cls];
  const temperatureK = Math.round((t0 + ((t9 - t0) * (sub ?? 5)) / 9) / 100) * 100;
  const colour = CLASS_COLOUR[cls];
  const stage = lum ? CLASS_STAGE[lum] : undefined;

  const summary =
    `Spectral type ${raw}: ${/^[aeiou]/.test(colour.colour) ? "an" : "a"} ${colour.colour} star of class ${cls}${sub !== undefined ? sub : ""} (surface roughly ${temperatureK.toLocaleString()} K — ${colour.note})` +
    (stage ? `, and a ${stage.stage} (class ${lum}): ${stage.explain}.` : ". The catalog gives no luminosity class, so its life stage is not pinned down.");

  return { raw, class: cls, subclass: sub, luminosity: lum, colour: colour.colour, colourHex: colour.hex, temperatureK, stage: stage?.stage, summary, notes };
}

/** Absolute visual magnitude from apparent magnitude and distance (light-years). */
export function absoluteMagnitude(apparent: number, distanceLy: number): number {
  const parsecs = distanceLy / 3.26156;
  return apparent - 5 * Math.log10(parsecs / 10);
}

/**
 * Visual luminosity relative to the Sun (absolute visual magnitude of the Sun = 4.83).
 * "Visual" because we only have the V-band magnitude; hot and cool stars emit
 * much of their light outside the visible band, so this understates them.
 */
export function visualLuminositySuns(apparent: number, distanceLy: number): number {
  return 10 ** ((4.83 - absoluteMagnitude(apparent, distanceLy)) / 2.5);
}

export function formatLuminosity(suns: number): string {
  if (suns < 0.1) return `${suns.toFixed(3)} times the Sun's`;
  if (suns < 10) return `${suns.toFixed(1)} times the Sun's`;
  if (suns < 1000) return `about ${Math.round(suns / 10) * 10} times the Sun's`;
  return `about ${Math.round(suns / 100) * 100} times the Sun's`;
}

/** "The light you see tonight left it around 1560 AD." */
export function lightLeftYear(distanceLy: number, now = new Date()): string {
  const year = now.getFullYear() - Math.round(distanceLy);
  if (distanceLy < 1) return "less than a year ago";
  if (distanceLy < 100) return `${Math.round(distanceLy)} years ago (around ${year})`;
  if (year > 0) return `about ${Math.round(distanceLy)} years ago (around the year ${year})`;
  return `about ${Math.round(distanceLy).toLocaleString()} years ago (around ${Math.abs(year).toLocaleString()} BC)`;
}

export type VisibilityCalendar = {
  /** "circumpolar" (never sets), "never" (never rises), or "seasonal". */
  kind: "circumpolar" | "never" | "seasonal";
  /** Months (0–11) in which the star is above `minAltitude` at 9 PM local time. */
  eveningMonths: number[];
  /** Month (0–11) when it is highest at 9 PM. */
  bestMonth?: number;
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/**
 * Which months a star is up in the evening for an observer. Uses 9 PM on the
 * 15th of each month; "9 PM local" is approximated as 21:00 at the observer's
 * longitude (solar time), which is close enough for a month-level answer.
 */
export function visibilityCalendar(star: Star, observer: Observer, year: number, minAltitude = 20): VisibilityCalendar {
  const polar = 90 - Math.abs(observer.latitude);
  if (observer.latitude >= 0 ? star.dec > polar : star.dec < -polar) return { kind: "circumpolar", eveningMonths: [...Array(12).keys()] };
  if (observer.latitude >= 0 ? star.dec < -polar : star.dec > polar) return { kind: "never", eveningMonths: [] };

  const eveningMonths: number[] = [];
  let best = -Infinity;
  let bestMonth: number | undefined;
  for (let month = 0; month < 12; month++) {
    // 21:00 local solar time = 21:00 UTC minus longitude/15 hours.
    const utcHour = 21 - observer.longitude / 15;
    const date = new Date(Date.UTC(year, month, 15, 0, 0, 0) + utcHour * 3_600_000);
    const alt = toHorizontal(star, createSkyFrame(observer, date)).altitude;
    if (alt > minAltitude) eveningMonths.push(month);
    if (alt > best) {
      best = alt;
      bestMonth = month;
    }
  }
  return { kind: "seasonal", eveningMonths, bestMonth };
}

export function monthName(m: number): string {
  return MONTHS[m];
}

/** "June to October, highest in August" */
export function describeCalendar(cal: VisibilityCalendar): string {
  if (cal.kind === "circumpolar") return "Up all year, every night — it never sets from this latitude.";
  if (cal.kind === "never") return "Never rises from this latitude; you would need to travel south to see it.";
  if (cal.eveningMonths.length === 0) return "Above the horizon at some hours, but never high in the evening sky from here; try the hours before dawn.";
  // Compress months into ranges, allowing wrap around December -> January.
  const set = new Set(cal.eveningMonths);
  let start = 0;
  while (set.has(start) && set.has((start + 11) % 12) && start < 12) start++;
  const ordered = [...Array(12).keys()].map((i) => (start + i) % 12).filter((m) => set.has(m));
  const first = ordered[0];
  const last = ordered[ordered.length - 1];
  const span = first === last ? monthName(first) : `${monthName(first)} to ${monthName(last)}`;
  return `Evening viewing from ${span}${cal.bestMonth !== undefined ? `, highest around 9 PM in ${monthName(cal.bestMonth)}` : ""}.`;
}
