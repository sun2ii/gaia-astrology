/**
 * Two-sentence definitions for the words a beginner meets in the app.
 * Presentation data only. Used by <Term> to show a definition on demand.
 */
export const GLOSSARY: Record<string, { term: string; definition: string }> = {
  "sun sign": {
    term: "Sun sign",
    definition: "Which of the 12 zodiac slices the Sun was in on the day you were born. It is the sign people mean when they say \"I'm a Pisces\".",
  },
  "moon sign": {
    term: "Moon sign",
    definition: "Which slice the Moon was in when you were born. The Moon changes sign every 2–3 days, so it depends on the date and roughly the time.",
  },
  "rising sign": {
    term: "Rising sign",
    definition: "The zodiac slice that was coming up over the eastern horizon at the minute you were born. It changes every two hours or so, which is why it needs your birth time and place.",
  },
  zodiac: {
    term: "Zodiac",
    definition: "The band of sky the Sun, Moon and planets travel through, cut into 12 equal 30° slices called signs. A planet's sign is simply which slice it is in.",
  },
  degree: {
    term: "Degree",
    definition: "How far into its 30° slice a planet is (0–29). Early degrees mean it just entered the sign; late degrees mean it is about to leave.",
  },
  retrograde: {
    term: "Retrograde",
    definition: "When a planet appears to move backwards against the stars for a few weeks, because Earth is overtaking it. It never really reverses; astrology reads it as that planet's themes turning inward.",
  },
  house: {
    term: "House",
    definition: "One of 12 areas of life (money, home, career…) counted from your rising sign. A planet's house says where in life its themes tend to show up.",
  },
  aspect: {
    term: "Aspect",
    definition: "A named angle between two planets around the zodiac: together (conjunction), opposite (opposition), 90° apart (square), 120° (trine), 60° (sextile). Astrology reads each as a different kind of relationship.",
  },
  orb: {
    term: "Orb",
    definition: "How far an aspect is from being exact, in degrees. 0° is exact and strongest; past about 8° astrologers stop counting it.",
  },
  applying: {
    term: "Applying / separating",
    definition: "Applying means the two planets are still moving toward the exact angle, so the aspect is building. Separating means it has peaked and is fading.",
  },
  transit: {
    term: "Transit",
    definition: "Where a planet is in today's sky, measured against where a planet was in your birth chart. Daily horoscopes are written from these.",
  },
  midheaven: {
    term: "Midheaven",
    definition: "The point of the zodiac that was highest on the north–south line of the sky when you were born. Traditionally linked to career and public role.",
  },
  ecliptic: {
    term: "Ecliptic",
    definition: "The Sun's yearly path across the sky, which the Moon and planets also stay close to. Think of it as the road all of them travel on.",
  },
  "big three": {
    term: "Big Three",
    definition: "Your Sun, Moon and rising signs — the three placements beginners are told to learn first. Most of what people casually say about a chart comes from these.",
  },
  "outer planets": {
    term: "Outer planets",
    definition: "Uranus, Neptune and Pluto move so slowly that everyone born within several years shares their signs. They describe a generation more than an individual.",
  },
};

export type GlossaryKey = keyof typeof GLOSSARY;
