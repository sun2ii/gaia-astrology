import Link from "next/link";
import { LearnShell } from "@/components/LearnShell";
import { STARS } from "@/lib/catalog/stars";
import { CONCEPTS, STAR_CONCEPTS } from "@/lib/learn/concepts";
import { PLANETS, PLANET_ORDER } from "@/lib/learn/planets";
import { SIGNS, SIGN_ORDER } from "@/lib/learn/signs";

export const metadata = { title: "Learn — Night Sky" };

export default function LearnIndex() {
  return (
    <LearnShell>
      <p className="eyebrow">LEARN</p>
      <h1>The words, one at a time</h1>
      <p className="lede">
        Reference pages for everything the chart can show you. Start with the concepts if the vocabulary is new; go to a sign or a
        planet when one of yours catches your eye; use a placement page (&ldquo;Moon in Virgo&rdquo;) for the combination.
      </p>

      <h2>Concepts</h2>
      <ul className="learn-list">
        {CONCEPTS.map((c) => (
          <li key={c.slug}>
            <Link href={`/learn/concepts/${c.slug}`}>{c.title}</Link>
            <span className="muted"> — {c.summary}</span>
          </li>
        ))}
      </ul>

      <h2>The stars themselves</h2>
      <p className="muted">
        <Link href="/learn/stars">Every star the app knows</Link> — all {STARS.length} of them, searchable, each with its distance, its kind, when to see
        it, and the story of its name.
      </p>
      <ul className="learn-list">
        {STAR_CONCEPTS.map((c) => (
          <li key={c.slug}>
            <Link href={`/learn/concepts/${c.slug}`}>{c.title}</Link>
            <span className="muted"> — {c.summary}</span>
          </li>
        ))}
      </ul>

      <h2>The twelve signs</h2>
      <ul className="learn-grid">
        {SIGN_ORDER.map((s) => (
          <li key={s}>
            <Link href={`/learn/signs/${s.toLowerCase()}`}>
              <span className="learn-glyph">{SIGNS[s].symbol}</span> {s}
            </Link>
            <span className="muted">{SIGNS[s].dates}</span>
          </li>
        ))}
      </ul>

      <h2>The Sun, Moon and planets</h2>
      <ul className="learn-grid">
        {PLANET_ORDER.map((p) => (
          <li key={p}>
            <Link href={`/learn/planets/${p}`}>
              <span className="learn-glyph">{PLANETS[p].symbol}</span> {PLANETS[p].name}
            </Link>
            <span className="muted">{PLANETS[p].keywords.slice(0, 3).join(" · ")}</span>
          </li>
        ))}
      </ul>

      <h2>Placements</h2>
      <p className="muted">
        Every planet in every sign has a page, e.g. <Link href="/learn/placements/moon-in-virgo">Moon in Virgo</Link> or{" "}
        <Link href="/learn/placements/sun-in-pisces">Sun in Pisces</Link>. From your birth chart, tap a placement&rsquo;s &ldquo;read
        more&rdquo; to land on its page.
      </p>
    </LearnShell>
  );
}
