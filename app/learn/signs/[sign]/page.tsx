import Link from "next/link";
import { notFound } from "next/navigation";
import { LearnShell } from "@/components/LearnShell";
import type { ZodiacSign } from "@/lib/astrology/types";
import { PLANET_ORDER, PLANETS } from "@/lib/learn/planets";
import { ELEMENT_NOTE, MODE_NOTE, SIGNS, SIGN_ORDER } from "@/lib/learn/signs";

export function generateStaticParams() {
  return SIGN_ORDER.map((s) => ({ sign: s.toLowerCase() }));
}

export default async function SignPage({ params }: { params: Promise<{ sign: string }> }) {
  const { sign } = await params;
  const name = (sign[0].toUpperCase() + sign.slice(1)) as ZodiacSign;
  const entry = SIGNS[name];
  if (!entry) notFound();
  const idx = SIGN_ORDER.indexOf(name);
  const prev = SIGN_ORDER[(idx + 11) % 12];
  const next = SIGN_ORDER[(idx + 1) % 12];

  return (
    <LearnShell crumbs={[{ label: "Signs" }, { label: name }]}>
      <p className="eyebrow">SIGN {idx + 1} OF 12 · {entry.element.toUpperCase()} · {entry.mode.toUpperCase()}</p>
      <h1>
        <span className="learn-glyph">{entry.symbol}</span> {name}
      </h1>
      <p className="lede">{entry.essence}</p>

      <dl className="learn-facts">
        <dt>Sun in {name}</dt>
        <dd>{entry.dates}</dd>
        <dt>Image</dt>
        <dd>{entry.image}</dd>
        <dt>Element · mode</dt>
        <dd>
          {entry.element} · {entry.mode}
        </dd>
        <dt>Ruled by</dt>
        <dd>{entry.ruler}</dd>
        <dt>Opposite sign</dt>
        <dd>
          <Link href={`/learn/signs/${entry.opposite.toLowerCase()}`}>{entry.opposite}</Link>
        </dd>
      </dl>

      <section>
        <h2>At its best</h2>
        <p>{entry.strengths}</p>
      </section>
      <section>
        <h2>Its difficulties</h2>
        <p>{entry.challenges}</p>
      </section>
      <section>
        <h2>As a Sun sign</h2>
        <p>{entry.asSun}</p>
      </section>
      <section>
        <h2>As a Moon sign</h2>
        <p>{entry.asMoon}</p>
      </section>
      <section>
        <h2>As a Rising sign</h2>
        <p>{entry.asRising}</p>
      </section>
      <section>
        <h2>In love and at work</h2>
        <p>
          In love, {name} is {entry.inLove}. At work, {entry.atWork}.
        </p>
      </section>
      <section>
        <h2>The element and the mode</h2>
        <p>{ELEMENT_NOTE[entry.element]}</p>
        <p>{MODE_NOTE[entry.mode]}</p>
      </section>
      <section>
        <h2>The sign and the constellation</h2>
        <p>
          The {name} of your chart is a 30° slice of the seasons, not the star pattern of the same name. Because the equinox point has
          drifted about 24° since the signs were named, the constellation {name} now sits mostly behind the next sign. Both are real;
          they are different maps. See <Link href="/learn/concepts/precession">Precession</Link>.
        </p>
      </section>

      <section>
        <h2>{name} with each planet</h2>
        <ul className="learn-list">
          {PLANET_ORDER.map((p) => (
            <li key={p}>
              <Link href={`/learn/placements/${p}-in-${sign}`}>
                {PLANETS[p].symbol} {PLANETS[p].name} in {name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <nav className="learn-pager">
        <Link href={`/learn/signs/${prev.toLowerCase()}`}>← {prev}</Link>
        <Link href={`/learn/signs/${next.toLowerCase()}`}>{next} →</Link>
      </nav>
    </LearnShell>
  );
}
