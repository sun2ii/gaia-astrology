import { LearnShell } from "@/components/LearnShell";
import { StarIndex } from "@/components/StarIndex";
import { CONSTELLATIONS } from "@/lib/astronomy/constellations";
import { STARS, STAR_CATALOG_META } from "@/lib/catalog/stars";
import { countStarNotes } from "@/lib/catalog/starNotes";

export const metadata = { title: "All the stars — Night Sky" };

export default function StarsIndexPage() {
  return (
    <LearnShell crumbs={[{ label: "Stars" }]}>
      <p className="eyebrow">THE CATALOG</p>
      <h1>Every star the app knows</h1>
      <p className="lede">
        {STAR_CATALOG_META.brightStarCount} bright stars (down to magnitude {STAR_CATALOG_META.cutoffMagnitude.toFixed(2)}) plus{" "}
        {STAR_CATALOG_META.figureStarCount} fainter ones that complete the constellation figures — {STARS.length} in all, from the Hipparcos
        catalogue. {countStarNotes()} of them have an encyclopedic note. Each page tells you how far the star is, what kind of star it is,
        when to look for it, and — where it has one — the story of its name.
      </p>
      <StarIndex stars={STARS} constellationNames={CONSTELLATIONS} />
    </LearnShell>
  );
}
