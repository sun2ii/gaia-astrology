/**
 * INTERPRETATION LAYER — the only place in the app that says what anything
 * "means". Everything here is traditional Western astrological keyword
 * language, written in plain English for a beginner. It is DATA composed
 * into sentences, not a measurement, and the engine never depends on it.
 *
 * Swap or extend this file to change the tradition or the tone; nothing in
 * lib/astrology/engine.ts, natal.ts or angles.ts will notice.
 */
import type { SolarSystemBodyId } from "@/lib/astronomy/solarSystem";
import type { AspectName, ZodiacSign } from "./types";

/** What each body is traditionally said to represent in a chart. */
export const BODY_MEANING: Record<SolarSystemBodyId, { role: string; short: string; explain: string }> = {
  sun: {
    role: "core self",
    short: "identity, vitality, what you are here to become",
    explain: "The Sun sign is the one people mean when they say \"I'm a Pisces\". It describes your core sense of self and the direction you naturally grow in.",
  },
  moon: {
    role: "emotions",
    short: "feelings, instincts, what makes you feel safe",
    explain: "The Moon describes your inner, private self: how you react before you think, what comforts you, and your emotional habits.",
  },
  mercury: {
    role: "mind",
    short: "thinking, talking, learning",
    explain: "Mercury describes how you take in information and express it — your communication style.",
  },
  venus: {
    role: "love and taste",
    short: "affection, attraction, pleasure, what you value",
    explain: "Venus describes how you relate, what you find beautiful, and how you give and receive affection.",
  },
  mars: {
    role: "drive",
    short: "energy, desire, anger, how you go after things",
    explain: "Mars describes how you act, compete, and assert yourself.",
  },
  jupiter: {
    role: "growth",
    short: "luck, expansion, optimism, beliefs",
    explain: "Jupiter describes where life tends to open up for you and how you find meaning.",
  },
  saturn: {
    role: "discipline",
    short: "limits, responsibility, lessons that take time",
    explain: "Saturn describes where you meet structure, delay and hard-won maturity.",
  },
  uranus: {
    role: "change",
    short: "originality, rebellion, sudden shifts",
    explain: "Uranus moves slowly, so its sign is shared by everyone born within about seven years — it describes a generation's style of breaking with the past.",
  },
  neptune: {
    role: "imagination",
    short: "dreams, ideals, spirituality, blurred lines",
    explain: "Neptune moves very slowly (about 14 years per sign); it describes a generation's dreams and illusions more than an individual.",
  },
  pluto: {
    role: "transformation",
    short: "power, depth, endings and rebirths",
    explain: "Pluto spends 12–30 years in a sign; it describes deep, generational themes of power and transformation.",
  },
};

/** Traditional keywords for each sign, plus its element and mode for context. */
export const SIGN_MEANING: Record<
  ZodiacSign,
  { element: "fire" | "earth" | "air" | "water"; mode: "cardinal" | "fixed" | "mutable"; keywords: string; style: string }
> = {
  Aries: { element: "fire", mode: "cardinal", keywords: "bold, direct, impatient, pioneering", style: "acts first and thinks later" },
  Taurus: { element: "earth", mode: "fixed", keywords: "steady, sensual, stubborn, loyal", style: "wants comfort, beauty and things that last" },
  Gemini: { element: "air", mode: "mutable", keywords: "curious, quick, talkative, restless", style: "needs variety and conversation" },
  Cancer: { element: "water", mode: "cardinal", keywords: "nurturing, protective, moody, home-loving", style: "leads with feeling and memory" },
  Leo: { element: "fire", mode: "fixed", keywords: "warm, proud, generous, dramatic", style: "wants to shine and be appreciated" },
  Virgo: { element: "earth", mode: "mutable", keywords: "precise, helpful, analytical, self-critical", style: "notices details and wants to improve things" },
  Libra: { element: "air", mode: "cardinal", keywords: "diplomatic, fair, charming, indecisive", style: "seeks balance, harmony and partnership" },
  Scorpio: { element: "water", mode: "fixed", keywords: "intense, private, loyal, all-or-nothing", style: "goes deep and does not do surface" },
  Sagittarius: { element: "fire", mode: "mutable", keywords: "adventurous, honest, optimistic, blunt", style: "needs freedom, travel and big ideas" },
  Capricorn: { element: "earth", mode: "cardinal", keywords: "ambitious, disciplined, dry-humoured, cautious", style: "plays the long game" },
  Aquarius: { element: "air", mode: "fixed", keywords: "independent, inventive, humanitarian, detached", style: "thinks in systems and for the group" },
  Pisces: { element: "water", mode: "mutable", keywords: "compassionate, dreamy, intuitive, boundary-blurring", style: "feels everything and imagines more" },
};

/** Whole-sign house themes, 1–12. */
export const HOUSE_MEANING: Record<number, { theme: string; explain: string }> = {
  1: { theme: "self and appearance", explain: "how you come across and start things" },
  2: { theme: "money and possessions", explain: "what you earn, own and value" },
  3: { theme: "communication and siblings", explain: "everyday talk, short trips, learning" },
  4: { theme: "home and family", explain: "roots, parents, where you retreat to" },
  5: { theme: "creativity and romance", explain: "play, pleasure, children, self-expression" },
  6: { theme: "work and health", explain: "daily routines, service, the body" },
  7: { theme: "partnership", explain: "marriage, close one-to-one relationships, open enemies" },
  8: { theme: "shared resources and transformation", explain: "intimacy, other people's money, endings" },
  9: { theme: "beliefs and travel", explain: "philosophy, higher education, far places" },
  10: { theme: "career and reputation", explain: "public role, ambition, authority" },
  11: { theme: "friends and community", explain: "groups, hopes, networks" },
  12: { theme: "the hidden", explain: "solitude, the unconscious, what is behind the scenes" },
};

export const ASPECT_MEANING: Record<AspectName, { tone: string; explain: string }> = {
  conjunction: { tone: "fused", explain: "the two blend into one strong theme" },
  sextile: { tone: "easy opportunity", explain: "they cooperate with a little effort" },
  square: { tone: "friction", explain: "they pull against each other; tension that pushes growth" },
  trine: { tone: "flow", explain: "they support each other naturally, sometimes too comfortably" },
  opposition: { tone: "tug-of-war", explain: "two ends of one see-saw, seeking balance" },
};

export const ANGLE_MEANING = {
  ascendant: {
    name: "Rising sign (Ascendant)",
    explain: "The sign that was rising on the eastern horizon the minute you were born. It describes your first impression, your surface style, and it sets house 1.",
  },
  midheaven: {
    name: "Midheaven",
    explain: "The point of the zodiac crossing the north–south line of the sky (culminating) at your birth. It describes your public role, career direction and reputation.",
  },
};

/* ---------- Composition ---------- */

export function bodyInSign(body: SolarSystemBodyId, sign: ZodiacSign): string {
  const b = BODY_MEANING[body];
  const s = SIGN_MEANING[sign];
  const name = body[0].toUpperCase() + body.slice(1);
  return `Your ${name} (${b.short}) is in ${sign} — ${s.keywords}. In ${sign}, your ${b.role} ${s.style}.`;
}

export function bodyInHouse(body: SolarSystemBodyId, house: number): string {
  const h = HOUSE_MEANING[house];
  return `It sits in house ${house} (${h.theme}), so this energy shows up most in ${h.explain}.`;
}

export function retrogradeNote(body: SolarSystemBodyId): string {
  const name = body[0].toUpperCase() + body.slice(1);
  return `${name} was retrograde (appearing to move backwards) at your birth — traditionally read as this energy turned inward, more reflective and less straightforward.`;
}

export function aspectSentence(a: SolarSystemBodyId, aspect: AspectName, b: SolarSystemBodyId, natal = true): string {
  const A = a[0].toUpperCase() + a.slice(1);
  const B = b[0].toUpperCase() + b.slice(1);
  const m = ASPECT_MEANING[aspect];
  return natal
    ? `${A} ${aspect} ${B}: your ${BODY_MEANING[a].role} and your ${BODY_MEANING[b].role} are ${m.tone} — ${m.explain}.`
    : `${A} in today's sky is ${aspect} your natal ${B}: current ${BODY_MEANING[a].role} themes meet your ${BODY_MEANING[b].role} — ${m.explain}.`;
}

/** One line shown wherever interpretation appears. */
export const INTERPRETATION_DISCLAIMER =
  "These readings are traditional Western astrology keywords, offered as a lens rather than a measurement. The positions above are real; the meanings are a cultural tradition.";
