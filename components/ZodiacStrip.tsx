"use client";

import { ZODIAC_SIGNS, ZODIAC_SYMBOLS } from "@/lib/astrology/types";
import { SIGN_CONSTELLATION } from "@/lib/astrology/zodiacSky";

type Props = {
  /** Abbreviation of the currently selected constellation, if any. */
  selected: string | null;
  /** abbreviation -> is any of its figure above the horizon right now */
  upNow: Record<string, boolean>;
  onSelect: (abbreviation: string) => void;
};

/**
 * The twelve zodiac signs as a strip of glyphs. Tapping one selects the
 * constellation of that name on the chart (and the rim pointer shows where it
 * is when it is below the horizon). A dot under a glyph means "up now".
 */
export function ZodiacStrip({ selected, upNow, onSelect }: Props) {
  return (
    <nav className="zodiac-strip" aria-label="Zodiac constellations">
      {ZODIAC_SIGNS.map((sign) => {
        const abbr = SIGN_CONSTELLATION[sign];
        const active = selected === abbr;
        return (
          <button
            key={sign}
            type="button"
            className={`zodiac-chip${active ? " active" : ""}${upNow[abbr] ? " up" : ""}`}
            onClick={() => onSelect(abbr)}
            title={`${sign} — ${upNow[abbr] ? "above the horizon now" : "below the horizon now"}`}
            aria-pressed={active}
          >
            <span className="zodiac-chip-glyph">{ZODIAC_SYMBOLS[sign]}</span>
            <span className="zodiac-chip-name">{sign}</span>
          </button>
        );
      })}
    </nav>
  );
}
