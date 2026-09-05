/**
 * Downloads the raw catalog files that data/stars.json is built from and
 * stores them in data/raw/ so the build is reproducible offline.
 *
 * Run: npm run data:fetch
 *
 * Sources (see DATA_SOURCES.md for the full description):
 *   1. Hipparcos Main Catalogue (ESA 1997), VizieR I/239/hip_main
 *   2. Yale Bright Star Catalogue, 5th rev. ed. (Hoffleit & Warren 1991), VizieR V/50/catalog
 *   3. IAU Catalog of Star Names (IAU WGSN), IAU-CSN.txt
 *   4. IAU constellation boundaries lookup table (Roman 1987), VizieR VI/42/data.dat
 *   5. Stellarium "Modern" sky culture (constellation stick figures, CC BY-SA 4.0)
 *   6. Hipparcos rows for every star those figures reference (many are fainter than V 3.97)
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const RAW_DIR = path.join(process.cwd(), "data", "raw");

const VIZIER = "https://vizier.cds.unistra.fr/viz-bin/asu-tsv";

// We fetch a little deeper than the ~500-star cutoff (V ≈ 3.9) so that the
// selection step in build-stars.ts is done in code, not by the download.
const HIPPARCOS_URL =
  `${VIZIER}?-source=I/239/hip_main` +
  `&-out=HIP,RAICRS,DEICRS,Vmag,Plx,e_Plx,pmRA,pmDE,SpType,HD` +
  `&Vmag=%3C4.5&-out.max=5000&-sort=Vmag`;

const BSC_URL =
  `${VIZIER}?-source=V/50/catalog` +
  `&-out=HR,Name,HD,SAO,Vmag,SpType,Multiple,ADS,NoteFlag,RAJ2000,DEJ2000` +
  `&Vmag=%3C7.0&-out.max=20000&-sort=Vmag`;

const IAU_CSN_URL = "https://www.pas.rochester.edu/~emamajek/WGSN/IAU-CSN.txt";

const CONSTELLATION_BOUNDARIES_URL =
  "https://cdsarc.cds.unistra.fr/ftp/VI/42/data.dat";

const STELLARIUM_MODERN_URL =
  "https://raw.githubusercontent.com/Stellarium/stellarium/master/skycultures/modern/index.json";

const FILES: Array<{ name: string; url: string }> = [
  { name: "hipparcos_I239_vmag_lt_4.5.tsv", url: HIPPARCOS_URL },
  { name: "yale_bsc5_V50_vmag_lt_7.0.tsv", url: BSC_URL },
  { name: "IAU-CSN.txt", url: IAU_CSN_URL },
  { name: "constellation_boundaries_VI42.dat", url: CONSTELLATION_BOUNDARIES_URL },
  { name: "stellarium_modern_index.json", url: STELLARIUM_MODERN_URL },
];

/** Hipparcos rows for an explicit list of HIP numbers (VizieR accepts a comma-separated list). */
async function fetchHipparcosByHip(hips: number[]): Promise<string> {
  const CHUNK = 150;
  let combined = "";
  for (let i = 0; i < hips.length; i += CHUNK) {
    const chunk = hips.slice(i, i + CHUNK);
    const url =
      `${VIZIER}?-source=I/239/hip_main` +
      `&-out=HIP,RAICRS,DEICRS,Vmag,Plx,e_Plx,pmRA,pmDE,SpType,HD` +
      `&HIP=${chunk.join(",")}&-out.max=1000`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
    const text = await res.text();
    if (combined === "") {
      combined = text;
    } else {
      // Append only the data rows (skip comments, header, units, dashes).
      const lines = text.split("\n").filter((l) => l.length > 0 && !l.startsWith("#"));
      combined = combined.trimEnd() + "\n" + lines.slice(3).join("\n") + "\n";
    }
  }
  return combined;
}

/** HIP numbers referenced by the Stellarium constellation lines. */
function hipsInStellariumIndex(json: string): number[] {
  const index = JSON.parse(json) as { constellations: Array<{ lines: number[][] }> };
  const hips = new Set<number>();
  for (const c of index.constellations) for (const line of c.lines) for (const hip of line) hips.add(hip);
  return [...hips].sort((a, b) => a - b);
}

async function main() {
  await mkdir(RAW_DIR, { recursive: true });
  for (const file of FILES) {
    process.stdout.write(`Fetching ${file.name} ... `);
    const res = await fetch(file.url);
    if (!res.ok) throw new Error(`${file.url} -> HTTP ${res.status}`);
    const text = await res.text();
    await writeFile(path.join(RAW_DIR, file.name), text, "utf8");
    console.log(`${text.length.toLocaleString()} bytes`);
  }
  const stellarium = await readFile(path.join(RAW_DIR, "stellarium_modern_index.json"), "utf8");
  const hips = hipsInStellariumIndex(stellarium);
  process.stdout.write(`Fetching Hipparcos rows for ${hips.length} constellation-line stars ... `);
  const lineStars = await fetchHipparcosByHip(hips);
  await writeFile(path.join(RAW_DIR, "hipparcos_I239_constellation_line_stars.tsv"), lineStars, "utf8");
  console.log(`${lineStars.length.toLocaleString()} bytes`);

  await writeFile(
    path.join(RAW_DIR, "FETCHED.txt"),
    [
      `Fetched: ${new Date().toISOString()}`,
      ...FILES.map((f) => `${f.name}\n  ${f.url}`),
      `hipparcos_I239_constellation_line_stars.tsv\n  ${VIZIER}?-source=I/239/hip_main&HIP=<HIP numbers referenced by stellarium_modern_index.json>`,
      "",
    ].join("\n"),
    "utf8",
  );
  console.log("Done. Raw files are in data/raw/.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
