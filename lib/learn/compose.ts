/**
 * Composes a "planet in sign" deep dive (e.g. Moon in Virgo) from the planet
 * and sign entries. 10 × 12 = 120 combinations, generated rather than written
 * by hand, so every one has the same structure and nothing is invented beyond
 * what the two source entries say.
 */
import type { SolarSystemBodyId } from "@/lib/astronomy/solarSystem";
import type { ZodiacSign } from "@/lib/astrology/types";
import { PLANETS, type PlanetEntry } from "./planets";
import { SIGN_MEANING } from "@/lib/astrology/interpretations";
import { ELEMENT_NOTE, MODE_NOTE, SIGNS, type SignEntry } from "./signs";

export type PlacementPage = {
  planet: PlanetEntry;
  sign: SignEntry;
  title: string;
  slug: string;
  sections: Array<{ heading: string; body: string }>;
};

function list(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function placementSlug(planet: SolarSystemBodyId, sign: ZodiacSign): string {
  return `${planet}-in-${sign.toLowerCase()}`;
}

export function parsePlacementSlug(slug: string): { planet: SolarSystemBodyId; sign: ZodiacSign } | null {
  const m = /^([a-z]+)-in-([a-z]+)$/.exec(slug);
  if (!m) return null;
  const planet = m[1] as SolarSystemBodyId;
  const sign = (m[2][0].toUpperCase() + m[2].slice(1)) as ZodiacSign;
  if (!PLANETS[planet] || !SIGNS[sign]) return null;
  return { planet, sign };
}

export function composePlacement(planetId: SolarSystemBodyId, signName: ZodiacSign): PlacementPage {
  const planet = PLANETS[planetId];
  const sign = SIGNS[signName];
  const P = planet.name;
  /** "the Sun" / "the Moon" / "Mercury" */
  const theP = planetId === "sun" || planetId === "moon" ? `the ${P}` : P;
  const TheP = planetId === "sun" || planetId === "moon" ? `The ${P}` : P;
  const S = sign.sign;

  const sections: PlacementPage["sections"] = [];

  sections.push({
    heading: "In one sentence",
    body: `${TheP} stands for ${list(planet.domains)}; ${S} is ${list(sign.keywords)}. With ${theP} in ${S}, the way you handle ${planet.domains[0]} is ${S}'s way: it ${SIGN_MEANING[signName].style}.`,
  });

  sections.push({
    heading: `What ${theP} stands for`,
    body: `${planet.represents} ${planet.scope === "generational" ? `${P} moves so slowly that everyone born within years of you shares this sign; read it as a generational backdrop, and look to its house for the personal part.` : planet.scope === "social" ? `${P} takes about a year or more per sign, so this placement is shared with people born around the same time; its house in your chart is where it gets personal.` : `${P} changes sign quickly, so this placement is genuinely individual.`}`,
  });

  sections.push({
    heading: `What ${S} brings`,
    body: `${sign.essence} ${S} is a ${sign.mode} ${sign.element} sign. ${ELEMENT_NOTE[sign.element]} ${MODE_NOTE[sign.mode]}`,
  });

  const bigThree: Partial<Record<SolarSystemBodyId, string>> = { sun: sign.asSun, moon: sign.asMoon };
  if (bigThree[planetId]) {
    sections.push({ heading: `${TheP} in ${S}, specifically`, body: bigThree[planetId]! });
  } else {
    sections.push({
      heading: `${P} in ${S}, specifically`,
      body: `Your ${planet.domains.join(", ")} take on ${S}'s style. At its best this is ${sign.strengths.split(". ")[0].toLowerCase()} applied to ${planet.domains[0]}. ${planetId === "venus" ? `In love this shows as being ${sign.inLove}.` : planetId === "mars" || planetId === "saturn" || planetId === "jupiter" || planetId === "mercury" ? `At work this shows as being ${sign.atWork}.` : `In daily life it colours how ${planet.domains[0]} feels from the inside.`}`,
    });
  }

  sections.push({
    heading: "Strengths",
    body: `${sign.strengths} Applied to ${theP} (${list(planet.domains)}), these are the gifts of this placement.`,
  });

  sections.push({
    heading: "Watch-outs",
    body: `${sign.challenges} With ${theP} here, those tendencies show up in ${list(planet.domains)} first.`,
  });

  sections.push({
    heading: "In relationships and at work",
    body: `In love, ${S} energy is ${sign.inLove}. At work it is ${sign.atWork}. How much either applies depends on which planet: ${planetId === "venus" ? "with Venus here, the love side is the headline." : planetId === "mars" || planetId === "saturn" ? `with ${P} here, the work side is the headline.` : planetId === "sun" || planetId === "moon" ? `with ${P} here, both sides show — this placement is central.` : `with ${P} here, expect it in ${planet.domains[0]} more than anywhere.`}`,
  });

  sections.push({
    heading: "Retrograde and transits",
    body: `${planet.retrograde} When today's ${P} makes an aspect to your natal ${P}, the themes above are activated for a while. ${planet.inTransit.split(". ")[0]}.`,
  });

  sections.push({
    heading: "A note on what this is",
    body: `Everything numeric — that ${theP} was at a certain degree of ${S} — is a measurement. Everything descriptive above is traditional Western astrology, composed from the ${P} and ${S} reference pages. It is a lens, not a verdict.`,
  });

  return { planet, sign, title: `${TheP} in ${S}`, slug: placementSlug(planetId, signName), sections };
}
