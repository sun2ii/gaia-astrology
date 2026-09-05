/**
 * Builds data/stars.json from the raw catalog files in data/raw/.
 *
 * Run: npm run data:build      (after npm run data:fetch, or using the committed raw files)
 *
 * Pipeline
 * --------
 * 1. Hipparcos (I/239) is the PRIMARY source: it decides which stars are in the
 *    catalog (brightest ~500 by Johnson V magnitude), and supplies RA/Dec,
 *    magnitude, parallax (-> distance) and spectral type.
 * 2. Yale BSC5 (V/50) is joined by HD number to supply Bayer / Flamsteed
 *    designations and the HR number.
 * 3. IAU-CSN (IAU Working Group on Star Names) is joined by HIP number to supply
 *    official proper names. Stars without an IAU name get name: null.
 * 4. Constellation membership is computed from the star's position using the
 *    official IAU boundaries (Roman 1987 lookup table, VizieR VI/42), and
 *    cross-checked against the constellation implied by the BSC designation
 *    and the IAU-CSN table. Any disagreement fails the build.
 * 5. Stellarium's "Modern" sky culture supplies the constellation stick figures
 *    as lists of HIP numbers. Figure stars fainter than the cutoff are added to
 *    stars.json with tier: "figure" (from Hipparcos, same fields as above), and
 *    the figures themselves are written to data/constellations.json.
 *
 * Nothing in the output is invented: every field is either copied from a
 * catalog, or derived from catalog values by a documented formula.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { CONSTELLATIONS } from "../lib/astronomy/constellations";
import { constellationAt, parseBoundaryTable } from "../lib/astronomy/constellationLookup";
import type { Constellation, ConstellationCatalog, Star, StarCatalog } from "../lib/astronomy/types";

const ROOT = process.cwd();
const RAW = path.join(ROOT, "data", "raw");
const OUT = path.join(ROOT, "data", "stars.json");
const OUT_CONSTELLATIONS = path.join(ROOT, "data", "constellations.json");
const OUT_BOUNDARIES = path.join(ROOT, "data", "constellation_boundaries.json");

/** How many stars we aim for. All stars at least as bright as the Nth are kept (ties included). */
const TARGET_COUNT = 500;

/** Keep a distance only if the parallax is measured to better than this relative error. */
const MAX_RELATIVE_PARALLAX_ERROR = 0.2;

/** Light-years per parsec (IAU 2015 definitions: 1 pc = 648000/π au, 1 ly = 9.4607e15 m). */
const LY_PER_PARSEC = 3.26156;

const DEG = Math.PI / 180;

// ---------------------------------------------------------------------------
// Generic VizieR TSV parsing
// ---------------------------------------------------------------------------

type Row = Record<string, string>;

/** Parses VizieR "asu-tsv" output: comment lines start with '#', then header, units, dashes, data. */
function parseVizierTsv(text: string): Row[] {
  const lines = text.split("\n").filter((l) => l.length > 0 && !l.startsWith("#"));
  const header = lines[0].split("\t").map((s) => s.trim());
  const rows: Row[] = [];
  // lines[1] = units, lines[2] = dashes
  for (const line of lines.slice(3)) {
    const cells = line.split("\t");
    if (cells.length < header.length) continue;
    const row: Row = {};
    header.forEach((h, i) => (row[h] = cells[i] ?? "")); // not trimmed: BSC "Name" is fixed-width
    rows.push(row);
  }
  return rows;
}

const num = (s: string | undefined): number | undefined => {
  if (s === undefined || s.trim() === "") return undefined;
  const v = Number(s.trim());
  return Number.isFinite(v) ? v : undefined;
};

// ---------------------------------------------------------------------------
// 1. Hipparcos
// ---------------------------------------------------------------------------

type HipRow = {
  hip: number;
  ra: number; // deg, ICRS, epoch J1991.25
  dec: number;
  vmag: number;
  plx?: number;
  ePlx?: number;
  pmRA?: number; // mas/yr, includes cos(dec)
  pmDE?: number; // mas/yr
  spType?: string;
  hd?: number;
};

function loadHipparcos(text: string): HipRow[] {
  const out: HipRow[] = [];
  for (const r of parseVizierTsv(text)) {
    const hip = num(r.HIP);
    const ra = num(r.RAICRS);
    const dec = num(r.DEICRS);
    const vmag = num(r.Vmag);
    if (hip === undefined || ra === undefined || dec === undefined || vmag === undefined) continue;
    out.push({
      hip,
      ra,
      dec,
      vmag,
      plx: num(r.Plx),
      ePlx: num(r.e_Plx),
      pmRA: num(r.pmRA),
      pmDE: num(r.pmDE),
      spType: r.SpType?.trim() || undefined,
      hd: num(r.HD),
    });
  }
  return out;
}

/**
 * Moves a Hipparcos position from its catalog epoch (J1991.25) to J2000.0 using
 * the catalog proper motion. For bright stars this is a few milliarcseconds to
 * a few arcseconds — irrelevant for naked-eye use, but it lets us state the
 * epoch of every coordinate in stars.json unambiguously.
 */
function propagateToJ2000(row: HipRow): { ra: number; dec: number } {
  const years = 2000.0 - 1991.25;
  const masToDeg = 1 / 3_600_000;
  const pmRA = row.pmRA ?? 0;
  const pmDE = row.pmDE ?? 0;
  const cosDec = Math.cos((row.dec * Math.PI) / 180);
  let ra = row.ra + (cosDec !== 0 ? (pmRA * years * masToDeg) / cosDec : 0);
  const dec = row.dec + pmDE * years * masToDeg;
  ra = ((ra % 360) + 360) % 360;
  return { ra, dec };
}

// ---------------------------------------------------------------------------
// 2. Yale Bright Star Catalogue (designations)
// ---------------------------------------------------------------------------

/** BSC Greek-letter abbreviations -> Unicode letters. */
const GREEK: Record<string, string> = {
  Alp: "α", Bet: "β", Gam: "γ", Del: "δ", Eps: "ε", Zet: "ζ", Eta: "η", The: "θ",
  Iot: "ι", Kap: "κ", Lam: "λ", Mu: "μ", Nu: "ν", Xi: "ξ", Omi: "ο", Pi: "π",
  Rho: "ρ", Sig: "σ", Tau: "τ", Ups: "υ", Phi: "φ", Chi: "χ", Psi: "ψ", Ome: "ω",
};

const SUPERSCRIPT: Record<string, string> = { "1": "¹", "2": "²", "3": "³", "4": "⁴" };

type BscRow = {
  hr: number;
  hd?: number;
  bayer?: string; // e.g. "α", "θ¹"
  flamsteed?: number;
  constellation?: string; // from the Name field, e.g. "Lyr"
  multiple?: string;
  ra: number; // deg, J2000
  dec: number; // deg, J2000
};

/** Parses BSC sexagesimal coordinates: "06 45 08.9" (h m s) and "-16 42 58" (d m s). */
function parseSexagesimal(text: string, isHours: boolean): number {
  const t = text.trim();
  const sign = t.startsWith("-") ? -1 : 1;
  const [a, b, c] = t.replace(/^[+-]/, "").split(/\s+/).map(Number);
  const value = a + (b ?? 0) / 60 + (c ?? 0) / 3600;
  return sign * (isHours ? value * 15 : value);
}

/** Great-circle separation in arcseconds between two J2000 positions given in degrees. */
function separationArcsec(ra1: number, dec1: number, ra2: number, dec2: number): number {
  const d1 = dec1 * DEG, d2 = dec2 * DEG, dra = (ra1 - ra2) * DEG;
  const cosSep = Math.sin(d1) * Math.sin(d2) + Math.cos(d1) * Math.cos(d2) * Math.cos(dra);
  return (Math.acos(Math.min(1, Math.max(-1, cosSep))) / DEG) * 3600;
}

/**
 * The BSC "Name" field is a fixed-width 10-character string:
 *   cols 0-2 Flamsteed number, 3-5 Bayer letter, 6 Bayer index, 7-9 constellation.
 * Examples: "21Alp And", "   The1Eri", "  3Alp Lyr".
 */
function parseBscName(name: string): Pick<BscRow, "bayer" | "flamsteed" | "constellation"> {
  const padded = name.padEnd(10, " ");
  const flamsteed = num(padded.slice(0, 3).trim());
  const letter = padded.slice(3, 6).trim();
  const index = padded.slice(6, 7).trim();
  const constellation = padded.slice(7, 10).trim() || undefined;
  const greek = GREEK[letter];
  const bayer = greek ? greek + (index ? SUPERSCRIPT[index] ?? index : "") : undefined;
  return { bayer, flamsteed, constellation };
}

function loadBsc(text: string): { byHd: Map<number, BscRow>; all: BscRow[] } {
  const byHd = new Map<number, BscRow>();
  const all: BscRow[] = [];
  for (const r of parseVizierTsv(text)) {
    const hr = num(r.HR);
    const hd = num(r.HD);
    if (hr === undefined) continue;
    const row: BscRow = {
      hr,
      hd,
      multiple: r.Multiple?.trim() || undefined,
      ra: parseSexagesimal(r.RAJ2000, true),
      dec: parseSexagesimal(r.DEJ2000, false),
      ...parseBscName(r.Name ?? ""),
    };
    all.push(row);
    if (hd !== undefined && !byHd.has(hd)) byHd.set(hd, row);
  }
  return { byHd, all };
}

/**
 * Finds the BSC entry for a Hipparcos star. Primary key is the HD number. A few
 * close double stars carry different HD numbers in the two catalogs (e.g. ε Boo
 * is HD 129988 in Hipparcos but HD 129989 in the BSC); for those we fall back to
 * the nearest BSC entry within POSITION_MATCH_ARCSEC.
 */
const POSITION_MATCH_ARCSEC = 60;
function matchBsc(row: HipRow, ra: number, dec: number, bsc: { byHd: Map<number, BscRow>; all: BscRow[] }, log: string[]): BscRow | undefined {
  const direct = row.hd !== undefined ? bsc.byHd.get(row.hd) : undefined;
  if (direct) return direct;
  let best: BscRow | undefined;
  let bestSep = POSITION_MATCH_ARCSEC;
  for (const b of bsc.all) {
    if (Math.abs(b.dec - dec) > 0.05) continue;
    const sep = separationArcsec(ra, dec, b.ra, b.dec);
    if (sep < bestSep) { best = b; bestSep = sep; }
  }
  if (best) log.push(`HIP ${row.hip} (HD ${row.hd}) matched to HR ${best.hr} (HD ${best.hd}) by position, ${bestSep.toFixed(1)}"`);
  return best;
}

// ---------------------------------------------------------------------------
// 3. IAU Catalog of Star Names
// ---------------------------------------------------------------------------

type IauName = { name: string; constellation: string };

/**
 * IAU-CSN.txt is fixed-width. We take the name from the first 18 characters and
 * the numeric fields from the regular tail of the line:
 *   ... mag bnd HIP HD RA Dec Date
 */
function loadIauNames(text: string): Map<number, IauName> {
  const byHip = new Map<number, IauName>();
  const tail = /\s(\S+)\s+([VG])\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\d{4}-\d{2}-\d{2})/;
  for (const line of text.split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const m = tail.exec(line);
    if (!m) continue;
    const hip = num(m[3]);
    if (hip === undefined) continue;
    const name = line.slice(0, 18).trim();
    const constellation = line.slice(61, 65).trim();
    if (!name) continue;
    if (!byHip.has(hip)) byHip.set(hip, { name, constellation });
  }
  return byHip;
}

// ---------------------------------------------------------------------------
// 4. Constellation from position (Roman 1987, IAU boundaries)
//    Implementation lives in lib/astronomy/constellationLookup.ts so the app
//    can reuse it at runtime for the Sun, Moon and planets.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 5. Stellarium "Modern" sky culture — constellation stick figures
// ---------------------------------------------------------------------------

type StellariumIndex = {
  constellations: Array<{
    id: string; // "CON modern Ori"
    lines: number[][]; // HIP numbers
    common_name?: { english?: string; native?: string };
  }>;
};

function loadStellarium(text: string): Array<{ abbreviation: string; englishName: string; lines: number[][] }> {
  const index = JSON.parse(text) as StellariumIndex;
  return index.constellations.map((c) => ({
    abbreviation: c.id.split(" ").pop() ?? c.id,
    englishName: c.common_name?.english ?? "",
    lines: c.lines,
  }));
}

// ---------------------------------------------------------------------------
// Assemble
// ---------------------------------------------------------------------------

function roundTo(value: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

/** Round a distance to 3 significant figures (e.g. 25.3, 863, 2,600). */
function roundDistance(ly: number): number {
  const digits = Math.floor(Math.log10(ly));
  const decimals = Math.max(0, 2 - digits);
  return roundTo(ly, decimals);
}

async function main() {
  const [hipText, hipLineText, bscText, iauText, boundaryText, stellariumText] = await Promise.all([
    readFile(path.join(RAW, "hipparcos_I239_vmag_lt_4.5.tsv"), "utf8"),
    readFile(path.join(RAW, "hipparcos_I239_constellation_line_stars.tsv"), "utf8"),
    readFile(path.join(RAW, "yale_bsc5_V50_vmag_lt_7.0.tsv"), "utf8"),
    readFile(path.join(RAW, "IAU-CSN.txt"), "utf8"),
    readFile(path.join(RAW, "constellation_boundaries_VI42.dat"), "utf8"),
    readFile(path.join(RAW, "stellarium_modern_index.json"), "utf8"),
  ]);

  const hip = loadHipparcos(hipText);
  const hipLineStars = loadHipparcos(hipLineText);
  const figures = loadStellarium(stellariumText);
  const bscData = loadBsc(bscText);
  const matchLog: string[] = [];
  const iauByHip = loadIauNames(iauText);
  const boundaries = parseBoundaryTable(boundaryText);

  // Selection: sort by V magnitude (brightest first); keep every star at least as
  // bright as the TARGET_COUNT-th one, so the cutoff is a magnitude, not an
  // arbitrary tie-break.
  hip.sort((a, b) => a.vmag - b.vmag || a.hip - b.hip);
  const cutoffMagnitude = hip[TARGET_COUNT - 1].vmag;
  const bright = hip.filter((r) => r.vmag <= cutoffMagnitude);
  const brightHips = new Set(bright.map((r) => r.hip));

  // Figure stars: every HIP a stick figure references that is not already in
  // the bright set. They come from the same Hipparcos catalog.
  const neededHips = new Set(figures.flatMap((f) => f.lines.flat()));
  const figureStars = hipLineStars.filter((r) => neededHips.has(r.hip) && !brightHips.has(r.hip));
  figureStars.sort((a, b) => a.vmag - b.vmag || a.hip - b.hip);
  const selected: Array<HipRow & { tier: Star["tier"] }> = [
    ...bright.map((r) => ({ ...r, tier: "bright" as const })),
    ...figureStars.map((r) => ({ ...r, tier: "figure" as const })),
  ];

  const problems: string[] = [];
  const stars: Star[] = [];
  const stats = { named: 0, bayer: 0, flamsteed: 0, hr: 0, hipOnly: 0, withDistance: 0, withSpType: 0 };

  for (const row of selected) {
    const { ra, dec } = propagateToJ2000(row);
    const bsc = matchBsc(row, ra, dec, bscData, matchLog);
    const iau = iauByHip.get(row.hip);

    // Constellation: authoritative answer from IAU boundaries; cross-checked.
    const constellation = constellationAt(ra, dec, boundaries);
    if (bsc?.constellation && bsc.constellation !== constellation) {
      problems.push(`HIP ${row.hip}: boundary says ${constellation}, BSC designation says ${bsc.constellation}`);
    }
    if (iau?.constellation && iau.constellation !== constellation) {
      problems.push(`HIP ${row.hip}: boundary says ${constellation}, IAU-CSN says ${iau.constellation}`);
    }
    if (!CONSTELLATIONS[constellation]) problems.push(`HIP ${row.hip}: unknown constellation ${constellation}`);

    // Designation preference: Bayer > Flamsteed > HR > HIP.
    let designation: string;
    if (bsc?.bayer) {
      designation = `${bsc.bayer} ${constellation}`;
      stats.bayer++;
    } else if (bsc?.flamsteed !== undefined) {
      designation = `${bsc.flamsteed} ${constellation}`;
      stats.flamsteed++;
    } else if (bsc) {
      designation = `HR ${bsc.hr}`;
      stats.hr++;
    } else {
      designation = `HIP ${row.hip}`;
      stats.hipOnly++;
    }

    // Distance from parallax, only when the measurement is reasonably precise.
    let distanceLightYears: number | undefined;
    if (row.plx !== undefined && row.plx > 0 && row.ePlx !== undefined && row.ePlx / row.plx <= MAX_RELATIVE_PARALLAX_ERROR) {
      distanceLightYears = roundDistance((1000 / row.plx) * LY_PER_PARSEC);
      stats.withDistance++;
    }

    if (iau) stats.named++;
    if (row.spType) stats.withSpType++;

    const star: Star = {
      id: `hip-${row.hip}`,
      name: iau?.name ?? null,
      designation,
      ra: roundTo(ra, 5),
      dec: roundTo(dec, 5),
      apparentMagnitude: row.vmag,
      tier: row.tier,
      constellation,
      constellationName: CONSTELLATIONS[constellation] ?? constellation,
      ...(distanceLightYears !== undefined ? { distanceLightYears } : {}),
      ...(row.spType ? { spectralType: row.spType } : {}),
      catalogIds: {
        hip: row.hip,
        ...(row.hd !== undefined ? { hd: row.hd } : {}),
        ...(bsc ? { hr: bsc.hr } : {}),
      },
    };
    stars.push(star);
  }

  // Constellation figures: translate HIP numbers to star ids; every vertex must exist.
  const starIds = new Set(stars.map((s) => s.id));
  const constellations: Constellation[] = figures
    .map((f) => ({
      abbreviation: f.abbreviation,
      name: CONSTELLATIONS[f.abbreviation] ?? f.abbreviation,
      englishName: f.englishName,
      lines: f.lines.map((line) => line.map((hipNo) => `hip-${hipNo}`)),
    }))
    .sort((a, b) => a.abbreviation.localeCompare(b.abbreviation));
  for (const c of constellations) {
    if (!CONSTELLATIONS[c.abbreviation]) problems.push(`Figure for unknown constellation ${c.abbreviation}`);
    for (const line of c.lines) for (const id of line) if (!starIds.has(id)) problems.push(`${c.abbreviation}: figure references missing star ${id}`);
  }
  if (constellations.length !== 88) problems.push(`Expected 88 constellation figures, got ${constellations.length}`);

  if (problems.length) {
    console.error("Cross-check problems:\n  " + problems.join("\n  "));
    process.exit(1);
  }

  const catalog: StarCatalog = {
    meta: {
      generatedAt: new Date().toISOString(),
      starCount: stars.length,
      brightStarCount: bright.length,
      figureStarCount: figureStars.length,
      cutoffMagnitude,
      coordinateSystem: "ICRS, epoch J2000.0, decimal degrees",
      sources: [
        "Hipparcos Main Catalogue (ESA 1997), VizieR I/239/hip_main — selection, RA/Dec, Vmag, parallax, spectral type",
        "Yale Bright Star Catalogue 5th rev. ed. (Hoffleit & Warren 1991), VizieR V/50 — Bayer/Flamsteed designations, HR numbers",
        "IAU Catalog of Star Names (IAU WGSN, IAU-CSN) — proper names",
        "IAU constellation boundaries lookup table (Roman 1987), VizieR VI/42 — constellation membership",
      ],
    },
    stars,
  };

  await writeFile(OUT, JSON.stringify(catalog, null, 2) + "\n", "utf8");

  const constellationCatalog: ConstellationCatalog = {
    meta: {
      generatedAt: catalog.meta.generatedAt,
      constellationCount: constellations.length,
      source: "Stellarium 'Modern' sky culture (skycultures/modern/index.json) — stick figures as Hipparcos numbers; English names from its common_name field",
      license: "CC BY-SA 4.0 (Stellarium's team)",
    },
    constellations,
  };
  await writeFile(OUT_CONSTELLATIONS, JSON.stringify(constellationCatalog, null, 2) + "\n", "utf8");

  // The boundary lookup table itself, for runtime use (Sun/Moon/planets).
  await writeFile(
    OUT_BOUNDARIES,
    JSON.stringify({ source: "Roman 1987 (PASP 99, 695), VizieR VI/42; B1875.0 equinox", boundaries }, null, 0) + "\n",
    "utf8",
  );
  console.log(`Wrote ${OUT_CONSTELLATIONS} (${constellations.length} constellations)`);

  console.log(`Wrote ${OUT}`);
  console.log(`  stars:            ${stars.length} = ${bright.length} bright (target ${TARGET_COUNT}) + ${figureStars.length} figure-only`);
  console.log(`  cutoff magnitude: V <= ${cutoffMagnitude.toFixed(2)}`);
  console.log(`  IAU proper names: ${stats.named}`);
  console.log(`  designations:     Bayer ${stats.bayer}, Flamsteed ${stats.flamsteed}, HR ${stats.hr}, HIP-only ${stats.hipOnly}`);
  console.log(`  with distance:    ${stats.withDistance} (parallax error <= ${MAX_RELATIVE_PARALLAX_ERROR * 100}%)`);
  console.log(`  with spectral:    ${stats.withSpType}`);
  if (matchLog.length) console.log(`  BSC position fallbacks:\n    ${matchLog.join("\n    ")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
