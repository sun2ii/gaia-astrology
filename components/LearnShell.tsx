import Link from "next/link";

/** Shared reading layout for the Learn section. Server component. */
export function LearnShell({ children, crumbs }: { children: React.ReactNode; crumbs?: Array<{ href?: string; label: string }> }) {
  return (
    <div className="learn">
      <nav className="learn-nav">
        <Link href="/">← Sky</Link>
        <Link href="/learn">Learn</Link>
        {crumbs?.map((c, i) =>
          c.href ? (
            <Link key={i} href={c.href}>
              {c.label}
            </Link>
          ) : (
            <span key={i}>{c.label}</span>
          ),
        )}
      </nav>
      <article className="learn-article">{children}</article>
    </div>
  );
}

export function Sections({ sections }: { sections: Array<{ heading: string; body: string }> }) {
  return (
    <>
      {sections.map((s) => (
        <section key={s.heading}>
          <h2>{s.heading}</h2>
          <p>{s.body}</p>
        </section>
      ))}
    </>
  );
}
