# Gaia — California Night Sky Explorer (V9)

Walk outside, look up, and know what you are looking at.

Given where you are (latitude/longitude) and when (date/time), the app draws a
look-up chart of the sky with the constellation figures, lists the brightest
stars above your horizon, tells you which way to face and how high to look,
and — when you click a star or a constellation — what it is called, what it
belongs to, how far away it is and what kind of star it is.

The same sky is offered three ways: **astronomy** (what is physically above
you), **astrology** (the Sun, Moon and planets re-labelled on the tropical
zodiac, with retrograde status and the five major aspects; plus your own
**birth chart** with rising sign, whole-sign houses and today's transits), and
**interpretation** (plain-English keyword meanings, kept in one swappable data
file). The layers are strictly separate: the astrology engine contains no
horoscope prose, and the astronomy layer is the single source of truth both
read from.

The learning set is the **508 brightest stars** (Johnson V ≤ 3.97) from the
Hipparcos catalogue; a further 285 fainter Hipparcos stars are drawn on the
chart only so the 88 constellation figures are complete. Planets, the Moon,
deep-sky objects and constellation boundaries/mythology are later layers.

## Run it

```
npm install
npm run dev        # http://localhost:3000
npm test           # 110 verification tests (vitest)
npm run build      # production build
```

The date/time controls are interpreted in the browser's own time zone (shown
next to the Time field). Latitude and longitude default to Orangevale, CA
(`lib/config/observer.ts`) and can be changed to anywhere on Earth.

## How it works (plain-English version)

Every star has a fixed "address" on the sky called **RA/Dec** (right
ascension and declination) — think longitude and latitude, but painted on the
inside of a giant sphere around the Earth. Those addresses come from star
catalogs and never change (on human timescales).

Where a given address appears in *your* sky depends on two things:

1. **Where you stand.** Your latitude decides how tilted the sky is (from the
   North Pole, Polaris is straight overhead; from the equator it sits on the
   horizon). Your longitude shifts which part of the sky is currently over you.
2. **What time it is.** The Earth turns once every 23 h 56 min, so the whole
   sky drifts westward about 15° per hour, and 1° per day relative to the Sun.

Combining those gives each star an **altitude** (how high: 0° horizon, 90°
overhead) and an **azimuth** (which way: 0° N, 90° E, 180° S, 270° W). That is
all the app computes. The plain-English directions ("face west-northwest and
look high in the sky") are just those two numbers translated into words.

**The time bar** steps the clock back or forward (10 minutes … 1 month) or
runs it at a chosen speed (real time up to a day per second). Try the
**1 sidereal day** step: 23 h 56 m later every star is back exactly where it
was, because that is one true rotation of the Earth. A 24-hour step leaves the
sky about 1° short — that 4-minutes-a-day difference is why the constellations
drift with the seasons.

**The page** is one full-screen chart with a toolbar along the bottom. Left
group: layer toggles (Stars, Constellations, Planets, Names). Middle: the
time bar. Right: drawers for the star list, the astrology view, observer
settings and a short "how to hold it" note. Clicking anything on the chart
opens its detail in the same drawer.

**The chart** is the sky dome seen from underneath: the zenith (straight up) is
the centre, the horizon is the rim, north is at the top, and the dashed rings
mark 30° and 60° up. East is on the *left* — hold the chart over your head with
N pointing north and it lines up with the real sky; a map you look *down* at
would have east on the right. Star dots scale with brightness; small grey dots
are the fainter stars that only exist to complete a figure. Each constellation
has its own colour, chosen so that no two neighbouring figures share one
(`lib/chart/constellationColors.ts`, a greedy graph colouring on the sky).

**The planets and the zodiac.** The Sun, Moon and planets are not in the star
catalog because they move; their positions come from the same ephemeris
library that turns RA/Dec into alt/az. Each body gets two numbers: where to
look (altitude/azimuth, for you) and its *ecliptic longitude* — how far along
the Sun's yearly path it is, measured from the March-equinox point *as it is
now*. Astrology divides that 0–360° into twelve 30° signs. Because the equinox
point drifts westward ~1° every 72 years (precession), the signs have slid
about 24° away from the constellations that share their names: the Sun can be
in the constellation Leo and at "Virgo 11°" at the same moment. The app shows
both, side by side, on purpose.

**Your birth chart** is the same calculation at a different moment: the sky
at your birth date, time and place. The date alone fixes your Sun sign; the
time and place add the **rising sign** (the zodiac point coming up over the
eastern horizon at that minute) and the **houses** (twelve areas of life
counted from the rising sign; V1 uses the whole-sign system, the oldest and
simplest). **Transits** compare where the planets are *now* with where they
were in your chart — that is the raw material daily horoscopes are written
from. Each item can be tapped for a short plain-English note. Birth data stays
in your browser (localStorage) and is never sent anywhere.

**Progressive disclosure.** The birth chart opens on your Big Three only,
with one "biggest transit today" line. "Go deeper" adds Venus and Mars, then
the other personal planets and the two simplest aspects, then everything
(outer planets, houses, all aspects, all transits). Any underlined term opens
a two-sentence definition in place (`lib/astrology/glossary.ts`). "Today's
sky" shows just the Sun, Moon and current retrogrades until you ask for all.

**Coming up** scans the ephemeris forward 60 days and lists New/Full Moons,
the Sun changing sign (seasons), planets turning retrograde or direct, your
solar return, and the moments a planet reaches an exact aspect to your Sun,
Moon or rising sign. Beginner filter on by default; "Show everything" adds
the rest. Instants are found by daily sampling plus bisection to the minute;
nothing is looked up from a table.

**Learn** (`/learn`, the "Learn" button in the toolbar) is the reading
section: a page per zodiac sign, per planet (astronomy facts labelled as
measured, tradition labelled as tradition), per concept (zodiac, ecliptic,
retrograde, aspects, houses, transits, precession…), and a generated page for
every planet-in-sign combination ("The Moon in Virgo", 120 pages) composed
from the planet and sign entries so nothing is invented beyond them. The
birth chart links each placement to its page.

**Every star** (`/learn/stars`) is a searchable index of all 793 stars, and
each has a page: the story of its name (Wikipedia lead paragraph, CC BY-SA,
linked), how far away it is and when the light you see left it, what kind of
star it is (decoded from its spectral type), when to look for it from the
default observer, and its catalog record. `npm run data:notes` fetches and
caches the notes.

**Zodiac layer** on the chart draws the ecliptic — the road the Sun, Moon and
planets travel — with the twelve 30° sign slices marked by glyph, highlights
the twelve zodiac constellations, and adds a strip of sign chips (dot = above
the horizon now). Tap a chip and the chart selects that constellation; if it
is below the horizon a pointer on the rim shows which way and how far down.
The glyph on the ecliptic and the constellation of the same name sit about one
sign apart — that gap is precession, visible on the chart.

## Project structure

```
data/
  stars.json                 the star catalog, two tiers (generated — see DATA_SOURCES.md)
  constellations.json        88 constellation stick figures as star ids (generated)
  constellation_boundaries.json  IAU boundary lookup table for runtime use (generated)
  raw/                       raw catalog extracts the JSON is built from (committed)

scripts/
  fetch-raw.ts               npm run data:fetch  — download raw extracts (needs network)
  build-stars.ts             npm run data:build  — build stars.json + constellations.json (offline)
  fetch-star-notes.ts        npm run data:notes  — Wikipedia lead paragraphs per star (network, slow, resumable)

lib/
  astronomy/
    types.ts                 Star, Observer, HorizontalCoordinates, VisibleStar
    coordinates.ts           RA/Dec -> alt/az (the ONLY file that touches the astronomy library)
    visibility.ts            getVisibleStars(), above-horizon and "useful" thresholds, sorting
    directions.ts            azimuth -> compass point, altitude -> words, "Face … and look …"
    projection.ts            alt/az -> x/y on the look-up chart (azimuthal equidistant)
    solarSystem.ts           Sun, Moon, planets: alt/az, constellation, ecliptic longitude, speed
    constellationLookup.ts   which IAU constellation contains an RA/Dec (Roman 1987 boundaries)
    constellations.ts        88 IAU constellation abbreviations -> names
  astrology/
    types.ts                 ZodiacSign, PlanetPlacement, Aspect, AstrologyState
    zodiac.ts                ecliptic longitude -> sign + degree (tropical)
    aspects.ts               aspect table (data) + findAspects()
    engine.ts                getAstrologyState(): sky state in, astrology state out — no prose
    angles.ts                Ascendant, Midheaven, whole-sign houses
    natal.ts                 birth chart (same engine, birth instant) and transits
    interpretations.ts       the ONLY file with meanings: keyword data + sentence composition
    glossary.ts              two-sentence definitions for the <Term> component
    events.ts                upcoming lunations, ingresses, stations, exact transits, solar return
  chart/constellationColors.ts  neighbour-aware colour assignment for the figures
  learn/
    signs.ts                 12 sign reference entries
    planets.ts               10 body reference entries (astronomy + tradition)
    concepts.ts              vocabulary essays
    compose.ts               planet-in-sign page composition (120 pages)
    stellar.ts               spectral-type decoder, luminosity, light-travel time, visibility months
  astrology/zodiacSky.ts     ecliptic + sign boundaries as alt/az; sign -> constellation map
  catalog/starNotes.ts       loads data/star_notes.json
  catalog/stars.ts           loads data/stars.json (swap for a DB/API later, nothing else changes)
  config/observer.ts         default observer (Orangevale, CA) and time zone
  time.ts                    date/time input helpers

components/
  NightSky.tsx               full-screen shell: chart, bottom toolbar, layer toggles, drawer
  TimeControls.tsx           step back/forward, play/pause, speed, "Now"
  ObserverControls.tsx       date, time, latitude, longitude, minimum altitude
  SkyChart.tsx               SVG look-up chart: stars, figures, labels, click/hover
  StarList.tsx               visible bright stars, brightest first
  StarDetail.tsx             one star: catalog facts + where it is right now
  ConstellationDetail.tsx    one constellation: where it is now + its bright stars
  BodyDetail.tsx             one Sun/Moon/planet: astronomy section + astrology section
  AstrologyPanel.tsx         placements table and current aspects
  BirthChartPanel.tsx        birth form; progressive chart (Big Three → … → advanced)
  UpcomingPanel.tsx          "Coming up" events list, grouped by day
  Term.tsx                   underlined word that opens a glossary definition

app/                         Next.js App Router shell (page.tsx renders <NightSky/>)
  learn/                     static reading pages: index, signs/[sign], planets/[planet], concepts/[slug], placements/[slug], stars, stars/[id]
tests/                       vitest verification tests
DATA_SOURCES.md              where every number comes from, selection rules, caveats
```

## Two kinds of data — kept separate on purpose

| **Catalog data** (from published star catalogs; same for everyone) | **Calculated for the observer** (depends on where and when) |
|---|---|
| RA, Dec, apparent magnitude, constellation, distance, spectral type, name, designation, tier, constellation figures | altitude, azimuth, visibility, compass direction, altitude description, chart position; planet positions, ecliptic longitudes, zodiac signs, retrograde flags, aspects |
| Lives in `data/stars.json` | Never stored; recomputed by `lib/astronomy/` on every change |

The star detail panel labels which is which. Full field-by-field provenance is
in [DATA_SOURCES.md](DATA_SOURCES.md).

## What "visible" means

Visibility is **geometric**: a star counts as visible when its altitude is
above 0° (above the mathematical horizon), and as "useful for learning" when it
is above a configurable threshold (default 10°, `DEFAULT_USEFUL_ALTITUDE_DEG` in
`lib/astronomy/visibility.ts`), because stars in the bottom 10° are hard to
find and easy to confuse with planets, aircraft and streetlights.

Geometric visibility is not a promise you will see the star. Real visibility
also depends on light pollution, weather, haze and extinction near the
horizon, the Moon, your eyesight and dark adaptation, and what is blocking your
horizon. None of that is modelled yet, and neither is atmospheric refraction
(which lifts objects near the horizon by up to ~0.5°).

## The astronomy library

RA/Dec → alt/az is done by [astronomy-engine](https://github.com/cosinekitty/astronomy)
(MIT, ~100 KB, zero dependencies, TypeScript types included). It was chosen
because it is small, actively maintained, validated against JPL Horizons, and
converts J2000 equatorial coordinates straight into the observer's horizon
frame, handling precession, nutation and sidereal time internally.

Application code never imports it directly; everything goes through
`lib/astronomy/coordinates.ts` (`createSkyFrame`, `toHorizontal`,
`getHorizontalCoordinates`), so the library can be replaced without touching
the rest of the app.

## Verification

`npm test` runs 110 tests. They check physical relationships rather than
hard-coded numbers from a black box:

- Polaris stays within 2° of due north and within 0.8° of the observer's
  latitude in altitude, every month of the year, from California.
- Raising the observer's latitude raises Polaris; a star's maximum altitude
  equals 90° − |latitude − declination| and occurs due south (or due north),
  for northern and southern observers.
- A star returns to the same alt/az after one sidereal day, not one solar day;
  moving 15° west and looking an hour later shows the same sky.
- Azimuth is always in [0°, 360°) and altitude in [−90°, +90°] for every
  catalog star, at several dates, from the equator to both poles.
- Stars below the horizon are excluded; the minimum-altitude filter is honoured;
  results are sorted brightest first.
- An independent textbook alt/az calculation (Meeus) agrees with the engine to
  within 0.6° for 4,000+ star/time/place combinations — enough to catch any
  sign, unit or azimuth-convention mistake.
- Compass sectors, altitude bands and the "Face … and look …" sentence.
- Catalog integrity: ~500 bright stars, unique ids/designations/names, all
  fields in range, all constellations valid, ~half the stars named (no
  invented names), reference values for Sirius, Vega, Polaris and Betelgeuse.
- Chart projection: zenith at centre, horizon on the rim, N up, E left, 45° is
  halfway out, exact round-trip through the inverse projection.
- Constellation figures: exactly 88, one per IAU constellation, every vertex
  exists, figure-only stars are all used by a figure and all fainter than the
  bright cutoff.
- Colouring: every constellation gets a palette colour, no two neighbours
  share one, and the result is deterministic.
- Time bar: the sidereal-day step returns every star to the same altitude;
  a solar-day step moves the sky by ~1°.
- Solar system: the Sun's ecliptic longitude is exactly 0°/90°/180°/270° at
  the equinoxes and solstices (instants computed independently); Sun and Moon
  longitudes agree with the library's dedicated routines; the Sun stays in the
  zodiac band of constellations all year; Sun ≈ 1°/day, Moon ≈ 13°/day.
- Birth chart: the Ascendant lies exactly on the eastern horizon and the
  Midheaven exactly on the meridian (checked through the alt/az engine, five
  observers/dates on both hemispheres); sidereal time gains ~0.986°/day; a
  March 5 birth is a Pisces Sun; the natal chart equals the live sky at the
  birth instant; on a birthday the Sun conjoins its natal position; unknown
  birth time drops angles/houses; time-zone conversion with and without DST.
- Stellar decoder: class/subclass/luminosity parsing, temperatures ordered
  O→M with the Sun near 5,800 K, >99% of the catalog parses, absolute
  magnitude 4.83 at 10 pc by construction, Sirius ≈ +1.4, Polaris circumpolar
  and Canopus never rising from California, Betelgeuse a winter evening star
  and Vega a summer one.
- Zodiac layer: the ecliptic frame places the Sun's longitude exactly at the
  Sun's alt/az from the ephemeris; twelve sign boundaries; half the ecliptic
  above the horizon at any instant.
- Learn content: every sign and body entry is complete, opposites are
  symmetric, concept cross-links resolve, and all 120 placement pages compose
  with the same structure and no template leaks.
- Events: "Sun enters Libra" lands on the independently computed September
  equinox; New/Full Moon events match the library's phase search to the
  second; the solar return falls within a day of the birthday; Mercury has
  ~6 stations a year, alternating retrograde/direct.
- Astrology: sign boundaries; the worked examples (161.4° → Virgo 11.4°,
  Moon 83° / Venus 203° → trine); the Sun enters Aries/Cancer/Libra/Capricorn
  exactly at the season points; Sun ☌ Moon at a New Moon and ☍ at a Full Moon
  (moon-phase instants computed independently); Sun and Moon are never
  retrograde while Mercury turns ~6 times a year; orbs, wrap-around at 0°,
  applying vs separating, custom aspect tables.

## Astrology: what is and isn't built

Built (calculation only): 10 placements on the tropical zodiac with degree,
retrograde/direct from the sign of the ecliptic speed, and the five major
aspects (conjunction, sextile, square, trine, opposition) with applying /
separating. Positions are geocentric apparent, equinox of date — the standard
astrological convention. The aspect table (angles and orbs) is data in
`lib/astrology/aspects.ts`, so another tradition is another table.

Also built: Ascendant and Midheaven, whole-sign houses, natal charts, transits
(orb 3°), and a keyword interpretation layer (`lib/astrology/interpretations.ts`)
composed into sentences at display time.

Not built: other house systems (Placidus, Koch…), synastry, dignities, nodes,
Chiron, progressions, sidereal zodiacs, and long-form interpretation text.
Interpretation is deliberately keyword-level and lives in one file so a
different tradition or tone is a file swap, never an engine change.

## Explicitly not built yet

No database, accounts, AR, camera, GPS, 3D/WebGL, constellation boundaries as
drawn outlines, mythology, deep-sky objects, weather or light-pollution data. The structure is meant to keep those additions local:
boundary outlines would be another generated data file drawn by `SkyChart`;
a database would replace `lib/catalog/stars.ts`; refraction would be one flag
in `coordinates.ts`.
