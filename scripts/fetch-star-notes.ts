/**
 * Fetches a short encyclopedic note for every star in data/stars.json from the
 * Wikipedia REST "summary" endpoint and caches it in data/star_notes.json.
 *
 * Run: npm run data:notes                  (resumable; already-fetched stars are skipped)
 *      npm run data:notes -- --retry-missing (also retry stars that had no match)
 *
 * Why Wikipedia: the star catalogs carry no history — no name origins, no
 * discoveries. Wikipedia's lead paragraphs do, they are citable, and they are
 * licensed CC BY-SA 4.0 (attribution + share-alike; every note stores its URL).
 *
 * Lookup order per star: IAU proper name ("Vega") -> Latin Bayer/Flamsteed
 * designation ("Alpha Lyrae") -> the same with " (star)". A page is accepted
 * only if its short description or first sentence mentions a star, so
 * "Castor" does not return the mythological twin.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { designationToLatin } from "../lib/astronomy/constellationGenitives";
import type { StarCatalog } from "../lib/astronomy/types";

const ROOT = process.cwd();
const STARS = path.join(ROOT, "data", "stars.json");
const OUT = path.join(ROOT, "data", "star_notes.json");
const USER_AGENT = "gaia-night-sky/1.0 (educational star chart; https://github.com/benbasuni)";
const DELAY_MS = 1500;

export type StarNote = {
  title: string;
  extract: string;
  description?: string;
  url: string;
  source: "wikipedia";
  license: "CC BY-SA 4.0";
  fetchedAt: string;
};

type Summary = {
  type: string;
  title: string;
  description?: string;
  extract?: string;
  content_urls?: { desktop?: { page?: string } };
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function summary(title: string): Promise<Summary | null> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } });
    if (res.status === 404) return null;
    if (res.status === 429 || res.status >= 500) {
      await sleep(DELAY_MS * (attempt + 2));
      continue;
    }
    if (!res.ok) return null;
    return (await res.json()) as Summary;
  }
  return null;
}

function looksLikeStar(s: Summary): boolean {
  if (s.type !== "standard") return false;
  const text = `${s.description ?? ""} ${(s.extract ?? "").slice(0, 300)}`.toLowerCase();
  return /\bstar\b|\bbinary\b|\bsupergiant\b|\bgiant\b|\bdwarf\b|\bvariable\b/.test(text) && !/\bmythology\b|\bfilm\b|\bband\b/.test(s.description?.toLowerCase() ?? "");
}

async function main() {
  const catalog = JSON.parse(await readFile(STARS, "utf8")) as StarCatalog;
  let notes: Record<string, StarNote | null> = {};
  try {
    notes = JSON.parse(await readFile(OUT, "utf8")) as typeof notes;
  } catch {
    /* first run */
  }

  let done = 0;
  for (const star of catalog.stars) {
    if (star.id in notes && !(process.argv.includes("--retry-missing") && notes[star.id] === null)) continue;
    const candidates: string[] = [];
    if (star.name) candidates.push(star.name, `${star.name} (star)`);
    const latin = designationToLatin(star.designation);
    if (latin) candidates.push(latin, `${latin} (star)`);
    if (star.catalogIds.hr) candidates.push(`HR ${star.catalogIds.hr}`);
    if (star.catalogIds.hd) candidates.push(`HD ${star.catalogIds.hd}`);

    let found: StarNote | null = null;
    for (const title of candidates) {
      const s = await summary(title);
      await sleep(DELAY_MS);
      if (s && looksLikeStar(s) && s.extract) {
        found = {
          title: s.title,
          extract: s.extract,
          description: s.description,
          url: s.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(s.title.replace(/ /g, "_"))}`,
          source: "wikipedia",
          license: "CC BY-SA 4.0",
          fetchedAt: new Date().toISOString(),
        };
        break;
      }
    }
    notes[star.id] = found;
    done++;
    if (done % 10 === 0) {
      await writeFile(OUT, JSON.stringify(notes, null, 1) + "\n", "utf8");
      const have = Object.values(notes).filter(Boolean).length;
      console.log(`${Object.keys(notes).length}/${catalog.stars.length} processed, ${have} with notes — last: ${star.name ?? star.designation} -> ${found ? found.title : "none"}`);
    }
  }
  await writeFile(OUT, JSON.stringify(notes, null, 1) + "\n", "utf8");
  const have = Object.values(notes).filter(Boolean).length;
  console.log(`Done: ${have}/${catalog.stars.length} stars have a note.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
