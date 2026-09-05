# Data sources — `data/stars.json`

This file documents where every field in `data/stars.json` comes from, how the
~500 stars were selected, and what the numbers do and do not mean.

`data/stars.json` is generated, never hand-edited. Regenerate it with:

```
npm run data:fetch   # downloads the raw catalog extracts into data/raw/ (needs network)
npm run data:build   # builds data/stars.json from data/raw/ (works offline)
```

The raw extracts in `data/raw/` are committed, so `data:build` is reproducible
without network access, and any change to the dataset shows up in version control.

## Sources

| # | Source | Used for | Access |
|---|--------|----------|--------|
| 1 | **Hipparcos Main Catalogue** (ESA 1997), VizieR `I/239/hip_main` | Star selection, RA/Dec, apparent magnitude, parallax → distance, spectral type, HD cross-id | https://cdsarc.cds.unistra.fr/viz-bin/cat/I/239 |
| 2 | **Yale Bright Star Catalogue**, 5th revised ed. (Hoffleit & Warren 1991), VizieR `V/50/catalog` | Bayer / Flamsteed designations, HR numbers | https://cdsarc.cds.unistra.fr/viz-bin/cat/V/50 |
| 3 | **IAU Catalog of Star Names** (IAU Working Group on Star Names, 2022-04-04 edition) | Proper names ("Vega", "Polaris", …) | https://www.iau.org/public/themes/naming_stars/ (file: https://www.pas.rochester.edu/~emamajek/WGSN/IAU-CSN.txt) |
| 4 | **IAU constellation boundaries** lookup table (Roman 1987, PASP 99, 695), VizieR `VI/42` | Constellation membership | https://cdsarc.cds.unistra.fr/viz-bin/cat/VI/42 |
| 6 | **Wikipedia** lead paragraphs, via the REST summary API, **CC BY-SA 4.0** | Per-star encyclopedic notes (name origins, history) in `data/star_notes.json` | https://en.wikipedia.org/api/rest_v1/ |
| 5 | **Stellarium "Modern" sky culture** (`skycultures/modern/index.json`), Stellarium's team, **CC BY-SA 4.0** | Constellation stick figures (as Hipparcos numbers) and English constellation names | https://github.com/Stellarium/stellarium/tree/master/skycultures/modern |

Hipparcos is the *primary* source: it decides which stars are in the file and
supplies the physical numbers. The other three are joined onto it to add names
and constellations.

## Selection: "the ~500 brightest stars"

- **Catalog:** Hipparcos Main Catalogue, all 118,218 entries.
- **Magnitude field:** `Vmag` — Johnson V apparent magnitude (Hipparcos field H5).
- **Rule:** sort by `Vmag` ascending (brightest first), take the 500th star's
  magnitude as the cutoff, keep every star at least that bright. Ties are kept
  rather than broken arbitrarily.
- **Result:** **508 stars, V ≤ 3.97.** Faintest included: V = 3.97. Brightest:
  Sirius, V = −1.44.

### Multiple stars

Each entry is one **Hipparcos catalog source**, not one naked-eye "point of
light". Consequences worth knowing:

- Wide pairs that Hipparcos resolved appear as **separate stars**. Example:
  α Centauri A (Rigil Kentaurus, HIP 71683, V −0.01) and α Centauri B (Toliman,
  HIP 71681, V 1.35) are two entries, although the eye sees one star of
  combined V ≈ −0.27.
- Close pairs that Hipparcos did not resolve appear as **one entry with the
  combined light**. Example: Castor (HIP 36850) is listed once at V 1.58 even
  though it is a multiple system.
- Where Hipparcos and the BSC assign different HD numbers to the components of
  a close pair, the build falls back to a positional match (within 60″) and
  logs it. In the current build this affects two stars: ε Boo (Izar) and
  α Psc (Alrescha).

### Other filtering decisions

- No filtering by declination: the file covers the whole sky, so it works for
  observers anywhere on Earth. From Orangevale (latitude 38.7° N), 432 of the 508 (85%)
  rise above the horizon at some point in the year; the remaining 76 have
  declination south of −51.3° and never do.
- Variable stars are included at the catalog `Vmag` (a single representative
  value). Betelgeuse, Mira-type and eclipsing variables can be noticeably
  brighter or fainter than listed on a given night.
- Nothing was removed by hand.

## Two tiers of stars

`stars.json` holds **793 stars** in two tiers, distinguished by the `tier` field:

| tier | count | what it is | where it appears |
|------|-------|------------|------------------|
| `bright` | 508 | the brightest-500 learning set (V ≤ 3.97), selected as above | the list, the "N / 508" count, and the chart |
| `figure` | 285 | fainter stars (V 3.98 – 6.65) included **only** because a constellation stick figure uses them as a vertex | the chart only, drawn small and grey |

Figure stars come from the same Hipparcos catalog with the same fields and the
same cross-checks; `data/raw/hipparcos_I239_constellation_line_stars.tsv` is
the Hipparcos extract for exactly the 710 HIP numbers the figures reference.
Nothing about the bright set changed when the figure tier was added.

## Constellation figures — `data/constellations.json`

The IAU defines constellation **boundaries** (used for membership above) but
has never defined how to draw the **stick figures**. The figures here are the
"Modern" sky-culture lines from Stellarium (source 5), chosen because they are
the most widely seen modern convention, are keyed by Hipparcos number (so they
join onto `catalogIds.hip` with no ambiguity), and are openly licensed.

- One figure per constellation, 88 in total, each a list of polylines of star ids.
- The build verifies that every vertex exists in `stars.json` and that every
  figure maps to a known IAU abbreviation.
- Seven vertices lie just outside their figure's own boundary, by design of the
  figure rather than by error: Auriga borrows β Tau (Elnath), the Great Square
  of Pegasus uses α And (Alpheratz), Serpens passes through Ophiuchus, and
  Carina/Monoceros each borrow a faint neighbour. Membership shown in the app
  always follows the IAU boundary, not the figure.
- `englishName` ("Eagle", "Water Bearer") is Stellarium's `common_name.english`.

Attribution required by the license: *Constellation figures: Stellarium's
team, "Modern" sky culture, CC BY-SA 4.0.*

## Field-by-field

| Field | Meaning | Source | Notes |
|-------|---------|--------|-------|
| `id` | Stable identifier | `"hip-" + HIP` | |
| `name` | Proper name, or `null` | IAU-CSN, joined by HIP number | 244 of the 508 bright stars (271 of all 793) have an IAU name. **No names are invented.** Stars without one are shown by designation. |
| `designation` | Astronomical designation | BSC `Name` field, formatted | Preference order: Bayer (`α Lyr`) → Flamsteed (`61 Cyg`) → `HR n` → `HIP n`. Current counts (all 793): Bayer 693, Flamsteed 55, HR 44, HIP 1. Greek letters are Unicode; superscripts (`α¹ Cen`) follow the BSC. |
| `ra` | Right ascension | Hipparcos `RAICRS` | **Decimal degrees**, 0–360. ICRS. Catalog epoch J1991.25, moved to **epoch J2000.0** with the Hipparcos proper motions (`pmRA`, `pmDE`). Rounded to 5 decimals (≈0.04″). |
| `dec` | Declination | Hipparcos `DEICRS` | **Decimal degrees**, −90 to +90. Same frame/epoch treatment as `ra`. |
| `apparentMagnitude` | Johnson V magnitude | Hipparcos `Vmag` | Lower = brighter. |
| `tier` | `"bright"` or `"figure"` | build rule | See "Two tiers of stars". |
| `constellation` | IAU 3-letter abbreviation | Computed from position (source 4) | See below. |
| `constellationName` | Latin name | `lib/astronomy/constellations.ts` | Static 88-entry table. |
| `distanceLightYears` | Distance | Hipparcos `Plx`, `e_Plx` | `ly = 1000 / Plx[mas] × 3.26156`. **Only present when `e_Plx / Plx ≤ 0.2`** (parallax known to better than 20%), otherwise omitted rather than shown as a misleading number. 459 of the 508 bright stars (719 of 793) have one. Rounded to 3 significant figures. Missing for 49 stars — mostly distant supergiants such as Betelgeuse, Antares, Deneb, Alnilam and Mintaka, whose 1997 Hipparcos parallaxes are too uncertain. |
| `spectralType` | Spectral type string | Hipparcos `SpType` | Copied verbatim (e.g. `A0Vvar`, `K1.5III`). Present for all 508. |
| `catalogIds.hip` | Hipparcos number | Hipparcos | Always present. |
| `catalogIds.hd` | Henry Draper number | Hipparcos `HD` | |
| `catalogIds.hr` | Harvard Revised (BSC) number | BSC `HR` | |

### Constellation membership

Constellation is computed from each star's J2000 position using the IAU
boundaries: the position is precessed to the B1875.0 equinox (in which
Delporte's 1930 boundaries are defined) with the rigorous formulae from Meeus,
*Astronomical Algorithms* ch. 21, then looked up in Roman's (1987) table
(VizieR VI/42).

The build then **cross-checks** the result against two independent opinions:
the constellation implied by the BSC designation (e.g. "Alp Lyr" → Lyr) and
the constellation column of the IAU-CSN. Any disagreement fails the build. In
the current build all 508 stars agree.

## Star notes — `data/star_notes.json`

The catalogs carry no history. For each of the 793 stars, `npm run data:notes`
asks Wikipedia's summary API for the lead paragraph of the star's article,
trying the IAU proper name first ("Vega"), then the Latin Bayer/Flamsteed form
("Alpha Lyrae"), then either with " (star)". A page is kept only if its short
description or opening sentence says it is a star (so "Castor" does not return
the mythological twin). Each note stores the article title, URL and fetch date.
The text is **CC BY-SA 4.0** and is shown with attribution and a link; the app
never edits it. Stars with no matching article show "no note yet" rather than
anything invented.

Derived stellar facts on the star pages (temperature, colour, life stage,
luminosity, light-travel time, evening visibility) come from
`lib/learn/stellar.ts`: textbook OBAFGKM classes and luminosity classes applied
to the catalog spectral type, the standard absolute-magnitude formula applied to
the catalog magnitude and parallax distance, and the alt/az engine sampled at
9 PM on the 15th of each month. No per-star physical values are hand-entered.

## Sun, Moon and planets (not in `stars.json`)

Solar-system bodies move, so they are computed at runtime from the
**astronomy-engine** ephemeris (VSOP87-based planets, an ILE-based Moon,
validated by its author against JPL Horizons) rather than stored. Per body:

| Quantity | How | Convention |
|----------|-----|------------|
| altitude / azimuth | `Equator(body, date, observer, ofdate=true, aberration=true)` → `Horizon` | topocentric, no refraction (same as stars) |
| constellation | J2000 geocentric RA/Dec → `constellationAt()` | IAU boundaries (Roman 1987) |
| ecliptic longitude / latitude | `Ecliptic(GeoVector(body, date, aberration=true))` | **geocentric apparent, true ecliptic and equinox of date** — the astrological convention |
| speed | longitude one hour later minus now, × 24 | degrees/day; negative = retrograde |
| magnitude, illuminated fraction | `Illumination(body, date)` | |

## Astrology conventions

- **Zodiac:** tropical. Sign = `floor(longitude / 30)`, degree = remainder.
  Aries 0° is the March-equinox point of date. Sidereal zodiacs (which add an
  ayanamsa offset) are not implemented.
- **Retrograde:** ecliptic speed < −0.0005°/day. Sun and Moon are never
  retrograde by construction.
- **Aspects:** the five Ptolemaic aspects with orbs conjunction 8°, sextile 6°,
  square 8°, trine 8°, opposition 8°. "Applying" means the separation is moving
  toward the exact angle. The table is data; other traditions = other tables.
- Because positions are geocentric, the observer's latitude/longitude does not
  affect signs or aspects. It does affect the **angles**: Ascendant and
  Midheaven use local sidereal time (`SiderealTime`, GAST) plus the observer's
  longitude, and the true obliquity (`e_tilt`), with the standard formulae
  (Meeus). Verified by checking that the Ascendant point has altitude 0° in the
  east and the Midheaven point has azimuth exactly 180°/0°.
- **Houses:** whole-sign only. House 1 = the sign containing the Ascendant.
- **Birth charts** are the same engine at the birth instant; the birth time is
  converted from local wall-clock time in a named IANA zone using the
  browser's Intl database. **Transits** are aspects between current and natal
  longitudes with a 3° orb.
- **Interpretation** (`lib/astrology/interpretations.ts`) is generic
  traditional keyword language written for this app; it is composed into
  sentences at display time and is the only place meaning appears.
- Nothing in the astrology layer is a physical measurement: it is a
  deterministic re-labelling of the ecliptic longitudes above. No
  interpretive text is generated.

## Coordinate conventions used throughout the app

| Quantity | Unit | Zero point | Range |
|----------|------|------------|-------|
| `ra` | decimal degrees | vernal equinox (ICRS/J2000) | [0, 360) |
| `dec` | decimal degrees | celestial equator, north positive | [−90, +90] |
| `latitude` | decimal degrees | equator, north positive | [−90, +90] |
| `longitude` | decimal degrees | Greenwich, **east positive** (California ≈ −121) | [−180, +180] |
| `altitude` | decimal degrees | horizon; 90 = zenith | [−90, +90] |
| `azimuth` | decimal degrees | **North**, increasing clockwise: 90 = E, 180 = S, 270 = W | [0, 360) |
| `eclipticLongitude` | decimal degrees | March-equinox point of date, eastward along the ecliptic | [0, 360) |

## Catalog data vs. calculated data

| Catalog data (in `stars.json`, same for everyone) | Calculated for the observer (never stored) |
|---|---|
| `ra`, `dec`, `apparentMagnitude`, `constellation`, `distanceLightYears`, `spectralType`, `name`, `designation`, `tier`, constellation figures | `altitude`, `azimuth`, above-horizon / useful-for-learning flags, compass direction, altitude description, chart position |

The calculated values depend on latitude, longitude and the instant of
observation and are recomputed by `lib/astronomy/` on every change.

## What "visible" means in V1

A star is listed as visible when it is **geometrically above the horizon**
(`altitude > 0°`), or above the configurable "useful" threshold (default 10°).
This is a statement about geometry, not a promise that you will see it.
Actual naked-eye visibility also depends on light pollution, weather, haze
and atmospheric extinction near the horizon, the Moon, your eyesight and dark
adaptation, and whatever buildings or hills block your horizon. Atmospheric
refraction (which lifts objects near the horizon by up to ~0.5°) is also
deliberately not applied in V1.

## Licensing / attribution

- Hipparcos, BSC5 and VI/42 are distributed by CDS/VizieR; cite the original
  papers when publishing (ESA 1997; Hoffleit & Warren 1991; Roman 1987).
- IAU star names are released under Creative Commons Attribution; cite the IAU
  WGSN.
- Constellation figures and English constellation names: Stellarium's team,
  CC BY-SA 4.0. Derivatives of that data (i.e. `data/constellations.json`)
  carry the same license.
