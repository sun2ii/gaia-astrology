/**
 * LEARN · PLANETS — long-form reference for the Sun, Moon and planets.
 *
 * Each entry mixes two kinds of statement and labels them: the astronomy
 * (orbits, cycles, discovery dates — physical facts) and the astrology (what
 * the tradition says the body represents — interpretation).
 */
import type { SolarSystemBodyId } from "@/lib/astronomy/solarSystem";

export type PlanetEntry = {
  id: SolarSystemBodyId;
  name: string;
  symbol: string;
  /** Physical facts. */
  astronomy: string;
  /** How long it spends in each sign, and how often it goes retrograde. */
  cycle: string;
  /** Personal / social / generational — how individual its sign is. */
  scope: "personal" | "social" | "generational";
  /** What the tradition says it represents. */
  represents: string;
  /** Reading it in a birth chart. */
  inBirthChart: string;
  /** Reading it as a transit (today's sky vs. your chart). */
  inTransit: string;
  /** What a retrograde of this body is traditionally read as, or why it never happens. */
  retrograde: string;
  /** Domains of life the composer can bind to a sign's style. */
  domains: string[];
  keywords: string[];
};

export const PLANETS: Record<SolarSystemBodyId, PlanetEntry> = {
  sun: {
    id: "sun",
    name: "Sun",
    symbol: "☉",
    astronomy:
      "The star at the centre of the solar system. From Earth it appears to travel once around the zodiac each year along the path called the ecliptic; the equinoxes and solstices are the four points where it crosses or reaches the ends of that path.",
    cycle: "About one month in each sign, one full circuit per year. The Sun never goes retrograde.",
    scope: "personal",
    represents:
      "Identity, vitality, purpose — the centre you organise your life around. The Sun sign is the one everyone knows, because you only need a birth date to find it.",
    inBirthChart:
      "Your Sun sign describes who you are becoming: the core self you grow into over a lifetime, your basic style of being alive, what makes you feel like yourself. Its house shows the area of life where that self is most expressed.",
    inTransit:
      "The Sun moves a degree a day, so its transits are brief — a day or two of spotlight on whatever natal planet it touches. Once a year it returns to your natal Sun: your solar return, your astrological birthday.",
    retrograde: "Never. The Sun is what everything else is measured against.",
    domains: ["identity", "vitality", "purpose", "self-expression"],
    keywords: ["self", "will", "vitality", "purpose"],
  },
  moon: {
    id: "moon",
    name: "Moon",
    symbol: "☽",
    astronomy:
      "Earth's satellite, orbiting us every 27.3 days. Its phases — new, first quarter, full, last quarter — are the changing angle between the Moon and the Sun as seen from Earth. A New Moon is the Moon lined up with the Sun; a Full Moon is the Moon opposite it.",
    cycle: "About two and a half days in each sign; the whole zodiac in under a month. Never retrograde.",
    scope: "personal",
    represents:
      "Emotions, instincts, memory, the body's needs, what makes you feel safe. Where the Sun is who you are becoming, the Moon is who you already are when no one is watching.",
    inBirthChart:
      "Your Moon sign describes your emotional weather: how you react before you think, what comforts you, how you were mothered and how you nurture. Because the Moon changes sign every couple of days, it needs a birth date and roughly a birth time.",
    inTransit:
      "The Moon crosses every planet in your chart every month, so its transits are the daily moods — a few hours of feeling whatever it touches. New and Full Moons landing on your natal planets are the ones worth noticing.",
    retrograde: "Never. The Moon's motion is always forward.",
    domains: ["emotions", "instincts", "comfort", "home life"],
    keywords: ["feelings", "instinct", "safety", "habit"],
  },
  mercury: {
    id: "mercury",
    name: "Mercury",
    symbol: "☿",
    astronomy:
      "The smallest planet and the closest to the Sun, orbiting it every 88 days. From Earth it never appears more than about 28° from the Sun, so it is only ever seen low in the sky just after sunset or before sunrise.",
    cycle: "Roughly three weeks per sign when moving normally, but it zigzags: about three times a year it turns retrograde for around three weeks.",
    scope: "personal",
    represents:
      "The mind: thinking, speaking, writing, learning, everyday movement and exchange. Mercury is the messenger — how information gets in and out of you.",
    inBirthChart:
      "Your Mercury sign describes how you think and communicate — fast or careful, in pictures or in lists, by talking or by writing. Because Mercury stays close to the Sun, it is always in your Sun sign or the one either side of it.",
    inTransit:
      "Mercury's transits are quick and mental: conversations, news, decisions, paperwork. Its retrograde periods are the famous ones — traditionally a time to review, re-read and re-check rather than launch.",
    retrograde:
      "About three times a year, for about three weeks. Read as: communication and plans turning inward or backward — re-doing, re-thinking, retrieving. Astronomically it is Earth overtaking Mercury on the inside track.",
    domains: ["thinking", "communication", "learning", "daily errands"],
    keywords: ["mind", "words", "curiosity", "exchange"],
  },
  venus: {
    id: "venus",
    name: "Venus",
    symbol: "♀",
    astronomy:
      "The second planet from the Sun and the brightest object in the sky after the Sun and Moon — the 'evening star' or 'morning star'. It orbits the Sun every 225 days and never appears more than about 47° from it.",
    cycle: "About a month per sign normally. Every 18 months or so it turns retrograde for about six weeks.",
    scope: "personal",
    represents:
      "Love, attraction, pleasure, beauty, what you value and what you are drawn to. Venus is how you relate and what you find worth wanting.",
    inBirthChart:
      "Your Venus sign describes your style in love and friendship, your taste, and how you give and receive affection. It is always within two signs of your Sun.",
    inTransit:
      "Venus transits are pleasant and social: attraction, ease, spending, making up. A Venus retrograde traditionally brings back old loves and old questions about what you value.",
    retrograde: "Rarely — every 18 months, for about six weeks. Read as: reconsidering relationships, values and money; not the time for a drastic makeover.",
    domains: ["love", "attraction", "taste", "values"],
    keywords: ["affection", "pleasure", "beauty", "harmony"],
  },
  mars: {
    id: "mars",
    name: "Mars",
    symbol: "♂",
    astronomy:
      "The fourth planet, the red one, orbiting the Sun every 687 days. Its brightness in our sky varies enormously depending on how close Earth is to it.",
    cycle: "About six weeks per sign, two years around the zodiac. Retrograde every 26 months or so, for about two months.",
    scope: "personal",
    represents:
      "Drive, desire, anger, action — how you go after what you want and how you fight. Mars is the engine and the sword.",
    inBirthChart:
      "Your Mars sign describes your energy style: how you assert yourself, compete, argue, and pursue. Its house shows where you put your effort and where you are most easily provoked.",
    inTransit:
      "Mars transits bring heat: motivation, conflict, accidents if rushed. A Mars transit to a natal planet is a push — useful for starting, risky for arguing.",
    retrograde: "Every two years or so, for about two months. Read as: drive turning inward, frustration, plans that stall and restart — a time to finish rather than begin.",
    domains: ["drive", "action", "desire", "conflict"],
    keywords: ["energy", "assertion", "courage", "anger"],
  },
  jupiter: {
    id: "jupiter",
    name: "Jupiter",
    symbol: "♃",
    astronomy:
      "The largest planet — more massive than all the others combined — orbiting the Sun every 11.9 years. Bright and easy to spot; through binoculars its four largest moons are visible.",
    cycle: "About a year per sign, twelve years around the zodiac. Retrograde for about four months every year.",
    scope: "social",
    represents:
      "Growth, expansion, luck, optimism, belief, generosity — and excess. Jupiter is where life opens up and where you may overdo it.",
    inBirthChart:
      "Your Jupiter sign is shared by everyone born in the same year, so it describes your generation's style of optimism; its house is more personal — the area of life where things tend to come easily and where you find meaning.",
    inTransit:
      "Jupiter transits are the traditionally 'lucky' ones: opportunity, confidence, growth, sometimes over-reach. The Jupiter return at ages 12, 24, 36, 48… marks the start of a new chapter.",
    retrograde: "About four months a year — so common it is less dramatic. Read as: growth and confidence turning inward; a time to consolidate rather than expand.",
    domains: ["growth", "belief", "opportunity", "generosity"],
    keywords: ["expansion", "luck", "meaning", "abundance"],
  },
  saturn: {
    id: "saturn",
    name: "Saturn",
    symbol: "♄",
    astronomy:
      "The ringed planet, the farthest one visible to the naked eye, orbiting the Sun every 29.5 years. It was the edge of the known solar system until 1781.",
    cycle: "About two and a half years per sign, 29.5 years around the zodiac. Retrograde for about four and a half months every year.",
    scope: "social",
    represents:
      "Structure, limits, time, responsibility, maturity — the lessons that take years. Saturn is the teacher who does not grade on a curve.",
    inBirthChart:
      "Your Saturn sign is shared by everyone within about two years; its house is the personal part — where you feel the most pressure, doubt yourself most, and, with work, build your most solid achievement.",
    inTransit:
      "Saturn transits are slow and serious: responsibility, reality checks, hard-won progress. The Saturn return at about 29 and again at about 58 is the famous one — the tradition's 'becoming an adult' moment.",
    retrograde: "About four and a half months a year. Read as: reviewing structures and commitments; delays that turn out to be useful.",
    domains: ["discipline", "responsibility", "limits", "long-term work"],
    keywords: ["structure", "time", "maturity", "authority"],
  },
  uranus: {
    id: "uranus",
    name: "Uranus",
    symbol: "♅",
    astronomy:
      "The first planet discovered with a telescope — by William Herschel in 1781 — and the first not known to the ancients. It orbits the Sun every 84 years, tipped on its side, and is just barely visible to the naked eye in a dark sky.",
    cycle: "About seven years per sign, 84 years around the zodiac. Retrograde for about five months every year.",
    scope: "generational",
    represents:
      "Change, originality, rebellion, sudden breaks, technology, freedom. Uranus is the lightning bolt — the thing that upends the settled pattern.",
    inBirthChart:
      "Your Uranus sign is shared by everyone born within about seven years, so it describes a generation's way of breaking with the past rather than you specifically. Its house is the personal part: the area of life where you are unconventional, restless, or ahead of your time.",
    inTransit:
      "Uranus transits are rare and memorable: sudden change, liberation, upheaval. They last a year or more. The Uranus opposition at about 42 is the tradition's 'midlife' transit; the Uranus return at 84 completes the cycle.",
    retrograde: "About five months a year — nearly half the time, so it is a normal state rather than an event. Read as: the urge for change working under the surface before it shows.",
    domains: ["change", "originality", "freedom", "disruption"],
    keywords: ["revolution", "invention", "surprise", "independence"],
  },
  neptune: {
    id: "neptune",
    name: "Neptune",
    symbol: "♆",
    astronomy:
      "Found in 1846 by mathematics before it was seen — astronomers predicted where a planet must be from Uranus's wobble. It orbits the Sun every 165 years and needs a telescope to be seen at all.",
    cycle: "About fourteen years per sign, 165 years around the zodiac. Retrograde for about five months every year.",
    scope: "generational",
    represents:
      "Dreams, imagination, spirituality, compassion, illusion and dissolving. Neptune is the fog and the ocean — what blurs the edges.",
    inBirthChart:
      "Your Neptune sign describes a generation's dreams and illusions (everyone born within about fourteen years shares it). Its house is where you are most idealistic, most inspired, and most easily deceived — including by yourself.",
    inTransit:
      "Neptune transits are slow and hazy: inspiration, confusion, longing, letting go. They last years and are easier to see in hindsight.",
    retrograde: "About five months a year. Read as: illusions clearing; the dream examined from the inside.",
    domains: ["imagination", "spirituality", "compassion", "escape"],
    keywords: ["dream", "dissolve", "inspire", "illusion"],
  },
  pluto: {
    id: "pluto",
    name: "Pluto",
    symbol: "♇",
    astronomy:
      "Discovered in 1930 and reclassified as a dwarf planet in 2006 — astrology kept using it. It takes 248 years to orbit the Sun on a stretched, tilted path, so it spends anywhere from 12 to 31 years in a sign.",
    cycle: "Twelve to thirty-one years per sign, 248 years around the zodiac. Retrograde for about five months every year.",
    scope: "generational",
    represents:
      "Transformation, power, depth, endings and rebirth, what is buried. Pluto is the underworld — the slow, total change.",
    inBirthChart:
      "Your Pluto sign belongs to your whole generation and describes its deep collective theme. Its house is where you meet power, loss and regeneration most directly in your own life.",
    inTransit:
      "Pluto transits are the rarest and the most profound: a few in a lifetime, each lasting years, each ending something so something else can begin.",
    retrograde: "About five months a year. Read as: transformation working underground.",
    domains: ["transformation", "power", "depth", "endings"],
    keywords: ["intensity", "rebirth", "control", "truth"],
  },
};

export const PLANET_ORDER: SolarSystemBodyId[] = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];
