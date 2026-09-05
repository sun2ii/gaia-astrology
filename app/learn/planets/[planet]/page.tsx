import Link from "next/link";
import { notFound } from "next/navigation";
import { LearnShell } from "@/components/LearnShell";
import type { SolarSystemBodyId } from "@/lib/astronomy/solarSystem";
import { PLANETS, PLANET_ORDER } from "@/lib/learn/planets";
import { SIGN_ORDER, SIGNS } from "@/lib/learn/signs";

export function generateStaticParams() {
  return PLANET_ORDER.map((p) => ({ planet: p }));
}

export default async function PlanetPage({ params }: { params: Promise<{ planet: string }> }) {
  const { planet } = await params;
  const entry = PLANETS[planet as SolarSystemBodyId];
  if (!entry) notFound();
  const idx = PLANET_ORDER.indexOf(entry.id);
  const prev = PLANET_ORDER[(idx + 9) % 10];
  const next = PLANET_ORDER[(idx + 1) % 10];
  const scopeNote = {
    personal: "A personal planet: it changes sign quickly, so its placement is genuinely individual.",
    social: "A social planet: it spends a year or more per sign, so its sign is shared with people born around the same time.",
    generational: "A generational planet: it spends many years per sign, so its sign describes an age group; its house is the personal part.",
  }[entry.scope];

  return (
    <LearnShell crumbs={[{ label: "Planets" }, { label: entry.name }]}>
      <p className="eyebrow">{entry.scope.toUpperCase()} PLANET</p>
      <h1>
        <span className="learn-glyph">{entry.symbol}</span> {entry.name}
      </h1>
      <p className="lede">{entry.represents}</p>

      <section>
        <h2>The astronomy (this part is measured)</h2>
        <p>{entry.astronomy}</p>
        <p>{entry.cycle}</p>
      </section>
      <section>
        <h2>Personal, social or generational?</h2>
        <p>{scopeNote}</p>
      </section>
      <section>
        <h2>In a birth chart</h2>
        <p>{entry.inBirthChart}</p>
      </section>
      <section>
        <h2>As a transit</h2>
        <p>{entry.inTransit}</p>
      </section>
      <section>
        <h2>Retrograde</h2>
        <p>{entry.retrograde}</p>
        <p>
          <Link href="/learn/concepts/retrograde">What retrograde is, physically →</Link>
        </p>
      </section>

      <section>
        <h2>{entry.name} in each sign</h2>
        <ul className="learn-grid">
          {SIGN_ORDER.map((s) => (
            <li key={s}>
              <Link href={`/learn/placements/${entry.id}-in-${s.toLowerCase()}`}>
                {SIGNS[s].symbol} {entry.name} in {s}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <nav className="learn-pager">
        <Link href={`/learn/planets/${prev}`}>← {PLANETS[prev].name}</Link>
        <Link href={`/learn/planets/${next}`}>{PLANETS[next].name} →</Link>
      </nav>
    </LearnShell>
  );
}
