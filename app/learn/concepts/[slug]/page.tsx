import Link from "next/link";
import { notFound } from "next/navigation";
import { LearnShell, Sections } from "@/components/LearnShell";
import { CONCEPTS, STAR_CONCEPTS, getConcept } from "@/lib/learn/concepts";

export function generateStaticParams() {
  return [...CONCEPTS, ...STAR_CONCEPTS].map((c) => ({ slug: c.slug }));
}

export default async function ConceptPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getConcept(slug);
  if (!entry) notFound();
  const related = entry.related.map(getConcept).filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <LearnShell crumbs={[{ label: "Concepts" }, { label: entry.title }]}>
      <p className="eyebrow">CONCEPT</p>
      <h1>{entry.title}</h1>
      <p className="lede">{entry.summary}</p>
      <Sections sections={entry.sections} />
      {related.length ? (
        <section>
          <h2>Related</h2>
          <ul className="learn-list">
            {related.map((r) => (
              <li key={r.slug}>
                <Link href={`/learn/concepts/${r.slug}`}>{r.title}</Link>
                <span className="muted"> — {r.summary}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </LearnShell>
  );
}
