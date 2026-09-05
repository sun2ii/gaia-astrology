/**
 * LEARN · CONCEPTS — the vocabulary, each as a short essay in sections.
 * Physical facts are marked as such in the text; the rest is the tradition.
 */
export type ConceptEntry = {
  slug: string;
  title: string;
  /** One line for the index. */
  summary: string;
  sections: Array<{ heading: string; body: string }>;
  /** Slugs of related concepts/pages. */
  related: string[];
};

export const CONCEPTS: ConceptEntry[] = [
  {
    slug: "zodiac",
    title: "The zodiac and the signs",
    summary: "The band of sky the planets travel through, cut into twelve equal slices.",
    sections: [
      {
        heading: "The physical part",
        body: "All the planets orbit the Sun in nearly the same flat plane, so from Earth they all travel across the sky along nearly the same road. That road is the ecliptic — the Sun's own yearly path. The zodiac is a band a few degrees either side of it.",
      },
      {
        heading: "The twelve slices",
        body: "Astrology cuts that 360° road into twelve equal 30° slices and names them Aries, Taurus, Gemini… A planet's 'sign' is simply which slice it is in, and its 'degree' is how far into the slice (0–29). The slices begin at the point where the Sun is on the March equinox — that point is 0° Aries.",
      },
      {
        heading: "Why the signs are not the constellations",
        body: "The slices were named about 2,000 years ago after the constellations behind them at the time. Since then Earth's slow wobble (precession) has slid the equinox point backwards by about 24° — almost a whole sign. So today the slice called Virgo sits mostly in front of the constellation Leo. Western astrology uses the slices tied to the seasons (the 'tropical' zodiac); the constellations are a different, older map. This app shows both so the difference is visible instead of hidden.",
      },
      {
        heading: "Elements and modes",
        body: "The twelve signs are also sorted two ways. By element — Fire (Aries, Leo, Sagittarius), Earth (Taurus, Virgo, Capricorn), Air (Gemini, Libra, Aquarius), Water (Cancer, Scorpio, Pisces) — which describes temperament: energetic, practical, mental, emotional. And by mode — Cardinal (starts things), Fixed (holds things), Mutable (adapts) — which describes how a sign moves. Every sign is one element plus one mode, and no two signs share the same pair.",
      },
    ],
    related: ["ecliptic", "degree", "elements-and-modes", "precession"],
  },
  {
    slug: "ecliptic",
    title: "The ecliptic",
    summary: "The Sun's yearly path across the sky — the road the planets share.",
    sections: [
      {
        heading: "What it is",
        body: "Over a year the Sun appears to move once around the sky against the background stars. The line it traces is the ecliptic. Because the planets orbit in nearly the same plane as Earth, they stay within a few degrees of that same line, and the Moon within about five. Look for planets in the sky and you will always find them strung along this one arc.",
      },
      {
        heading: "Why it matters for astrology",
        body: "Every astrological position — sign, degree, aspect — is a position along the ecliptic, measured in degrees from the March equinox point. The chart's numbers are literally 'how far along the road'. Altitude and azimuth (where to look in your sky) are a different measurement of the same object.",
      },
    ],
    related: ["zodiac", "degree"],
  },
  {
    slug: "degree",
    title: "Degrees and minutes",
    summary: "How far into its sign a planet is, and what the ′ means.",
    sections: [
      {
        heading: "Reading 'Virgo 11°41′'",
        body: "The zodiac is 360° around; each sign is 30° of it. 'Virgo 11°41′' means the planet is 11 degrees and 41 minutes into the Virgo slice. A minute (′) is one sixtieth of a degree, just like minutes on a clock — it has nothing to do with time.",
      },
      {
        heading: "Early, middle, late",
        body: "Astrologers read low degrees (0–9) as a planet freshly arrived in a sign, expressing it eagerly; middle degrees as settled; late degrees (25–29) as finishing up, about to change. The 29th degree gets special attention as a point of urgency.",
      },
    ],
    related: ["zodiac", "orb"],
  },
  {
    slug: "big-three",
    title: "The Big Three: Sun, Moon, Rising",
    summary: "The three placements to learn first, and why they carry most of the chart.",
    sections: [
      {
        heading: "Why three",
        body: "A chart has dozens of details, but most of what people recognise as 'you' in astrology comes from three: the Sun (who you are becoming), the Moon (who you are inside), and the Rising sign (how you come across). Beginner guides agree: learn these, live with them, and only then add more.",
      },
      {
        heading: "What each needs",
        body: "Sun sign needs only your birth date. Moon sign needs the date and roughly the time (the Moon changes sign every 2–3 days). Rising sign needs the exact time and the place, because it changes about every two hours and depends on where you were standing on Earth.",
      },
      {
        heading: "How they fit together",
        body: "A common way to read them: the Sun is the story, the Moon is the feeling underneath it, the Rising is the cover of the book. When they are in similar signs a person is 'what you see is what you get'; when they clash, the person contains contradictions that take time to understand.",
      },
    ],
    related: ["rising-sign", "houses"],
  },
  {
    slug: "rising-sign",
    title: "The Rising sign (Ascendant)",
    summary: "The zodiac slice coming up over the eastern horizon the minute you were born.",
    sections: [
      {
        heading: "The physical part",
        body: "At any moment, the ecliptic crosses your horizon in two places — one rising in the east, one setting in the west. The rising point is the Ascendant. Because the Earth turns, that point sweeps through all twelve signs every day, spending roughly two hours in each. This app checks it against the sky engine: the Ascendant point really is at 0° altitude, due east-ish.",
      },
      {
        heading: "What the tradition says",
        body: "The Rising sign describes your surface: first impressions, physical style, the mask you wear before people know you. It also sets the whole house system — it is the start of house 1 — which is why astrologers ask for a birth time before anything else.",
      },
      {
        heading: "Its partner, the Midheaven",
        body: "The Midheaven (MC) is where the ecliptic crosses the north–south line of your sky at birth — the culminating point. It is read as your public role, career direction and reputation.",
      },
    ],
    related: ["big-three", "houses"],
  },
  {
    slug: "houses",
    title: "Houses",
    summary: "Twelve areas of life, counted from your Rising sign.",
    sections: [
      {
        heading: "The idea",
        body: "Signs describe how a planet acts; houses describe where in life it acts. The wheel of the chart is divided into twelve houses starting from the eastern horizon. Traditional themes: 1 self, 2 money, 3 communication, 4 home, 5 creativity and romance, 6 work and health, 7 partnership, 8 shared resources and transformation, 9 beliefs and travel, 10 career, 11 friends and community, 12 the hidden.",
      },
      {
        heading: "Which system",
        body: "There are many ways to draw house boundaries (Placidus, Koch, Equal, Whole-sign…). This app uses whole-sign houses — the oldest system: the entire sign containing your Ascendant is house 1, the next sign is house 2, and so on. Simple, and easy to see on the wheel.",
      },
      {
        heading: "Why it needs a birth time",
        body: "Houses hang off the Rising sign, and the Rising sign moves through the whole zodiac every day. Without a birth time the houses can't be placed, which is why the app hides them when you tick 'I don't know my birth time'.",
      },
    ],
    related: ["rising-sign", "big-three"],
  },
  {
    slug: "retrograde",
    title: "Retrograde",
    summary: "When a planet appears to move backwards — and what astrology makes of it.",
    sections: [
      {
        heading: "The physical part",
        body: "Planets normally drift eastward against the stars. But Earth is also moving, and when it overtakes an outer planet (or an inner planet overtakes us) the other planet appears to slow, stop, slide backwards for weeks or months, stop again, and resume. Nothing reverses in reality — it is the same illusion as a slower car seeming to roll backwards as you pass it. Mercury does this about three times a year; the outer planets for months every year.",
      },
      {
        heading: "What the tradition says",
        body: "Astrology reads a retrograde as that planet's themes turning inward or backward: re-doing, re-thinking, revisiting. Mercury retrograde — communication and plans — is the famous one. In a birth chart, a retrograde planet is read as expressing itself in a more internal, reflective, less straightforward way.",
      },
      {
        heading: "Keeping it in proportion",
        body: "Uranus, Neptune and Pluto are retrograde nearly half of every year, so for them it is a normal state rather than an event. The Sun and Moon never go retrograde. The app marks retrograde with ℞ and lists the exact turning points ('stations') in Coming up.",
      },
    ],
    related: ["transits", "coming-up"],
  },
  {
    slug: "aspects",
    title: "Aspects",
    summary: "Named angles between two planets, read as kinds of relationship.",
    sections: [
      {
        heading: "The idea",
        body: "Take two planets and measure the angle between them around the zodiac. Certain angles get names: 0° conjunction (together), 60° sextile, 90° square, 120° trine, 180° opposition. These five are the 'major' aspects; there are minor ones too, which this app skips.",
      },
      {
        heading: "What each is read as",
        body: "Conjunction: the two blend into one strong theme. Sextile: easy cooperation with a little effort. Square: friction — they pull against each other, and the tension pushes growth. Trine: natural flow, sometimes so easy it goes unused. Opposition: a see-saw between two ends, seeking balance. Squares and oppositions are called 'hard', trines and sextiles 'soft' — hard is not bad; it is where the work is.",
      },
      {
        heading: "Orb",
        body: "Aspects are rarely exact. The orb is how far off exact the angle is; within about 8° (6° for sextiles) it still counts, and the tighter the orb, the stronger the aspect. 'Applying' means the planets are still moving toward exact; 'separating' means they have passed it.",
      },
    ],
    related: ["orb", "transits"],
  },
  {
    slug: "orb",
    title: "Orb",
    summary: "How close an aspect is to exact.",
    sections: [
      {
        heading: "In one paragraph",
        body: "A square is 90°. If two planets are 91.8° apart, the square has an orb of 1.8° — close, and strong. If they are 97° apart the orb is 7°, still within the usual limit but weak. Past about 8° astrologers stop counting it. For transits (today's planets against your chart) tighter orbs are used — this app uses 3° — because a transit is felt most as it becomes exact.",
      },
    ],
    related: ["aspects", "transits"],
  },
  {
    slug: "transits",
    title: "Transits",
    summary: "Today's sky measured against your birth chart — where horoscopes come from.",
    sections: [
      {
        heading: "The idea",
        body: "Your birth chart is a snapshot; the planets kept moving. A transit is the angle between a planet now and a planet (or point) in your chart. 'Saturn square your Sun' means Saturn in today's sky is 90° from where the Sun was when you were born. Daily and monthly horoscopes are, underneath the prose, lists of transits to a Sun sign.",
      },
      {
        heading: "Fast and slow",
        body: "The Moon transits everything in your chart every month — those are moods. The Sun, Mercury, Venus and Mars take days to weeks — those are events. Jupiter and Saturn take months and mark chapters. Uranus, Neptune and Pluto take years and are the handful of transits people remember decades later.",
      },
      {
        heading: "Returns",
        body: "When a planet comes back to where it was at your birth, it is a 'return'. The solar return is your birthday. The Saturn return (about 29 and 58) is the famous one — the tradition's threshold into adulthood and later into elderhood. The app's Coming up list finds your solar return and the exact moments of other transits to your Sun, Moon and Rising sign.",
      },
    ],
    related: ["aspects", "orb", "retrograde"],
  },
  {
    slug: "lunations",
    title: "New Moons and Full Moons",
    summary: "The Sun–Moon cycle, and why astrology watches it.",
    sections: [
      {
        heading: "The physical part",
        body: "A New Moon is the Moon passing between Earth and the Sun — invisible, because its lit side faces away. A Full Moon is the Moon opposite the Sun, fully lit. In chart terms a New Moon is a Sun–Moon conjunction and a Full Moon is a Sun–Moon opposition, which is exactly how this app detects them.",
      },
      {
        heading: "What the tradition says",
        body: "New Moons are read as beginnings: intentions, seeds, fresh starts, in the sign and house where they fall. Full Moons are culminations: things come to light, peak, or release. A New or Full Moon landing on one of your natal planets is traditionally a month worth watching.",
      },
    ],
    related: ["transits", "coming-up"],
  },
  {
    slug: "elements-and-modes",
    title: "Elements and modes",
    summary: "The two grids that organise the twelve signs.",
    sections: [
      {
        heading: "Four elements",
        body: "Fire (Aries, Leo, Sagittarius): energy, enthusiasm, action. Earth (Taurus, Virgo, Capricorn): the practical and the real. Air (Gemini, Libra, Aquarius): ideas, words, connection. Water (Cancer, Scorpio, Pisces): feeling and intuition. Counting how many of your planets fall in each element is a quick read of your temperament — lots of Water and little Air, say, is a person who feels first and explains later.",
      },
      {
        heading: "Three modes",
        body: "Cardinal (Aries, Cancer, Libra, Capricorn) start each season and start things. Fixed (Taurus, Leo, Scorpio, Aquarius) sit mid-season and sustain. Mutable (Gemini, Virgo, Sagittarius, Pisces) end each season and adapt. Element plus mode is unique to each sign: Pisces is the only Mutable Water sign, Virgo the only Mutable Earth.",
      },
    ],
    related: ["zodiac"],
  },
  {
    slug: "precession",
    title: "Precession: why the signs drifted",
    summary: "The 26,000-year wobble that separated the signs from the constellations.",
    sections: [
      {
        heading: "The physical part",
        body: "Earth's axis slowly circles like a spinning top's, once every ~26,000 years. That moves the equinox point — the zero of the tropical zodiac — backwards along the ecliptic by about 1° every 72 years. Since the zodiac signs were fixed to the constellations around 2,000 years ago, the drift has reached about 24°.",
      },
      {
        heading: "What it means for you",
        body: "Nothing changes about your sign: Western astrology deliberately ties the signs to the seasons (the equinox), not to the stars. But it does mean the 'Pisces' in your chart is a season-slice, not the fish-shaped constellation — and that the Sun in the constellation Leo can be at 'Virgo 11°'. The app shows both columns so you can see it for yourself.",
      },
    ],
    related: ["zodiac", "ecliptic"],
  },
  {
    slug: "coming-up",
    title: "Reading the Coming up list",
    summary: "What each kind of upcoming event is.",
    sections: [
      {
        heading: "The five kinds",
        body: "☽ Lunations — New and Full Moons, with the sign they fall in. → Ingresses — a planet entering a new sign (the Sun's are the seasons). ℞ Stations — a planet turning retrograde or direct. ✦ Transits — a planet in the sky reaching an exact aspect to a point in your chart. ☉ Solar return — the Sun back at your natal Sun, your astrological birthday.",
      },
      {
        heading: "How the app finds them",
        body: "Nothing is looked up from a table. The app samples the planets' positions once a day for the next 60 days, looks for a change (a sign boundary crossed, a speed flipping sign, an aspect passing exact), then narrows the moment down to the minute. New and Full Moons come from the ephemeris directly. The times shown are in your local time zone.",
      },
    ],
    related: ["transits", "retrograde", "lunations"],
  },
];

export const STAR_CONCEPTS: ConceptEntry[] = [
  {
    slug: "spectral-types",
    title: "How to read a spectral type",
    summary: "What 'K1.5III' or 'A0V' tells you about a star's colour, temperature and age.",
    sections: [
      {
        heading: "The letters: O B A F G K M",
        body: "Astronomers sort stars by the pattern of dark lines in their light, which turns out to track surface temperature. From hottest to coolest the classes run O, B, A, F, G, K, M — blue, blue-white, white, yellow-white, yellow, orange, red. The Sun is a G star. The digit after the letter is a finer step: A0 is hotter than A9.",
      },
      {
        heading: "The Roman numeral: size and life stage",
        body: "V means a main-sequence star — the long stable middle of life, fusing hydrogen in its core, like the Sun now. IV is a subgiant just starting to leave that stage. III is a giant: it has used up its core hydrogen and swollen enormously. II is a bright giant, and I (Ia, Iab, Ib) a supergiant — a massive star near the end, headed for a supernova. So 'K1.5III' is an orange giant; 'A0V' is a white star in its prime.",
      },
      {
        heading: "The small letters",
        body: "Suffixes flag oddities: 'var' variable brightness, 'p' peculiar chemistry, 'e' emission lines from surrounding gas, 'm' strong metal lines, 'n' broad lines from fast spin, 'SB' a spectroscopic binary. A '+' joins two stars whose light is mixed, as in Antares 'M1Ib + B2.5V' — a red supergiant with a hot blue companion.",
      },
      {
        heading: "Why it matters when you look up",
        body: "Colour is visible to the naked eye once you know to look: Betelgeuse (M) is distinctly orange-red, Rigel (B) blue-white, Arcturus (K) orange, Vega (A) white. The temperature difference between them is a factor of ten.",
      },
    ],
    related: ["magnitude"],
  },
  {
    slug: "magnitude",
    title: "Magnitude: how brightness is counted",
    summary: "Why lower numbers are brighter, and the difference between apparent and absolute.",
    sections: [
      {
        heading: "Apparent magnitude",
        body: "The scale is ancient and backwards: the Greek astronomer Hipparchus called the brightest stars 'first magnitude' and the faintest visible 'sixth'. It was later made exact: each step of 1 is about 2.5 times the light, and five steps is exactly 100 times. Very bright objects go negative — Sirius is −1.44, the full Moon about −12.7, the Sun −26.7. The app's bright set stops at 3.97.",
      },
      {
        heading: "Absolute magnitude and luminosity",
        body: "Apparent magnitude mixes true brightness with distance. Absolute magnitude removes the distance by imagining every star at the same standard distance (10 parsecs, about 32.6 light-years). From that the app estimates luminosity in Suns. It uses only visible light, so very hot and very cool stars — which shine mostly in ultraviolet or infrared — are underestimated.",
      },
    ],
    related: ["spectral-types"],
  },
];

export function getConcept(slug: string): ConceptEntry | undefined {
  return [...CONCEPTS, ...STAR_CONCEPTS].find((c) => c.slug === slug);
}
