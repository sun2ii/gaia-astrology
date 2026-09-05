import Link from "next/link";
import { notFound } from "next/navigation";
import { LearnShell, Sections } from "@/components/LearnShell";
import { composePlacement, parsePlacementSlug, placementSlug } from "@/lib/learn/compose";
import { PLANET_ORDER } from "@/lib/learn/planets";
import { SIGN_ORDER } from "@/lib/learn/signs";

export function generateStaticParams() {
  return PLANET_ORDER.flatMap((p) => SIGN_ORDER.map((s) => ({ slug: placementSlug(p, s) })));
}

export default async function PlacementPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const parsed = parsePlacementSlug(slug);
  if (!parsed) notFound();
  const page = composePlacement(parsed.planet, parsed.sign);

  return (
    <LearnShell crumbs={[{ label: "Placements" }, { label: page.title }]}>
      <p className="eyebrow">PLACEMENT</p>
      <h1>
        <span className="learn-glyph">
          {page.planet.symbol}
          {page.sign.symbol}
        </span>{" "}
        {page.title}
      </h1>
      <p className="lede">
        Read the <Link href={`/learn/planets/${page.planet.id}`}>{page.planet.name}</Link> page for what the planet is, the{" "}
        <Link href={`/learn/signs/${page.sign.sign.toLowerCase()}`}>{page.sign.sign}</Link> page for what the sign is, and this page for
        the two together.
      </p>
      <Sections sections={page.sections} />
    </LearnShell>
  );
}
