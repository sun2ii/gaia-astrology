import Link from "next/link";
import { notFound } from "next/navigation";
import { LearnShell } from "@/components/LearnShell";
import { CONSTELLATIONS_WITH_FIGURES, STARS, getStarById } from "@/lib/catalog/stars";
import { getStarNote } from "@/lib/catalog/starNotes";
import { DEFAULT_OBSERVER, DEFAULT_OBSERVER_LABEL } from "@/lib/config/observer";
import {
  absoluteMagnitude,
  decodeSpectralType,
  describeCalendar,
  formatLuminosity,
  lightLeftYear,
  visibilityCalendar,
  visualLuminositySuns,
} from "@/lib/learn/stellar";

export function generateStaticParams() {
  return STARS.map((s) => ({ id: s.id }));
}

export default async function StarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const star = getStarById(id);
  if (!star) notFound();
  const note = getStarNote(star.id);
  const spectral = decodeSpectralType(star.spectralType);
  const figure = CONSTELLATIONS_WITH_FIGURES.find((c) => c.abbreviation === star.constellation);
  const inFigure = figure?.lines.some((line) => line.includes(star.id)) ?? false;
  const year = new Date().getFullYear();
  const calendar = visibilityCalendar(star, DEFAULT_OBSERVER, year);
  const rankAll = [...STARS].sort((a, b) => a.apparentMagnitude - b.apparentMagnitude).findIndex((s) => s.id === star.id) + 1;
  const siblings = STARS.filter((s) => s.constellation === star.constellation && s.id !== star.id)
    .sort((a, b) => a.apparentMagnitude - b.apparentMagnitude)
    .slice(0, 8);

  return (
    <LearnShell crumbs={[{ href: "/learn/stars", label: "Stars" }, { label: star.name ?? star.designation }]}>
      <p className="eyebrow">
        {star.constellationName.toUpperCase()} · {rankAll <= 508 ? `#${rankAll} BRIGHTEST IN THE SKY` : "FIGURE STAR"}
      </p>
      <h1>
        {spectral.colourHex ? <span className="star-dot big" style={{ background: spectral.colourHex }} /> : null}
        {star.name ?? star.designation}
      </h1>
      <p className="lede">
        {star.name ? `${star.designation} · ` : ""}
        in {star.constellationName}
        {" · "}magnitude {star.apparentMagnitude.toFixed(2)}
        {star.distanceLightYears !== undefined ? ` · ${star.distanceLightYears.toLocaleString()} light-years` : ""}
      </p>

      {note ? (
        <section>
          <h2>The story</h2>
          <p>{note.extract}</p>
          <p className="muted">
            From <a href={note.url} target="_blank" rel="noreferrer">Wikipedia: {note.title}</a> (CC BY-SA 4.0). Read the full article for
            the history, mythology and science in depth.
          </p>
        </section>
      ) : (
        <section>
          <h2>The story</h2>
          <p className="muted">
            No encyclopedic note is attached to this star yet. It is identified in the catalogs as {star.designation} (HIP {star.catalogIds.hip}
            {star.catalogIds.hd ? `, HD ${star.catalogIds.hd}` : ""}).
          </p>
        </section>
      )}

      <section>
        <h2>The light you are seeing</h2>
        {star.distanceLightYears !== undefined ? (
          <p>
            {star.name ?? star.designation} is about {star.distanceLightYears.toLocaleString()} light-years away, so the light reaching your
            eye tonight left the star {lightLeftYear(star.distanceLightYears)}. Its true brightness — what you would see from a standard
            distance — is {formatLuminosity(visualLuminositySuns(star.apparentMagnitude, star.distanceLightYears))} (absolute visual magnitude{" "}
            {absoluteMagnitude(star.apparentMagnitude, star.distanceLightYears).toFixed(1)}).
          </p>
        ) : (
          <p>
            The Hipparcos distance for this star is too uncertain to publish (its parallax error is over 20%), so the app does not state how far
            away it is. It is far — stars without a usable parallax are typically hundreds or thousands of light-years off.
          </p>
        )}
        <p className="muted">
          Apparent magnitude {star.apparentMagnitude.toFixed(2)} is how bright it looks from Earth; lower numbers are brighter, and each step of 1
          is about 2.5 times the light.
        </p>
      </section>

      <section>
        <h2>What kind of star it is</h2>
        <p>{spectral.summary}</p>
        {spectral.notes.length ? (
          <ul className="learn-list">
            {spectral.notes.map((n) => (
              <li key={n}>Also {n}.</li>
            ))}
          </ul>
        ) : null}
        <p className="muted">
          Decoded from the catalog spectral type using the standard OBAFGKM classes and luminosity classes — see{" "}
          <Link href="/learn/concepts/spectral-types">How to read a spectral type</Link>.
        </p>
      </section>

      <section>
        <h2>When to see it from {DEFAULT_OBSERVER_LABEL}</h2>
        <p>{describeCalendar(calendar)}</p>
        <p className="muted">
          Declination {star.dec.toFixed(1)}°: {star.dec > 0 ? "north" : "south"} of the celestial equator.{" "}
          {inFigure ? `It is one of the stars that draws the ${star.constellationName} figure on the chart.` : `It is inside ${star.constellationName}'s boundary but not part of its stick figure.`}
        </p>
      </section>

      <section>
        <h2>Catalog record</h2>
        <dl className="learn-facts">
          <dt>Designation</dt>
          <dd>{star.designation}</dd>
          <dt>Hipparcos</dt>
          <dd>HIP {star.catalogIds.hip}</dd>
          {star.catalogIds.hr ? (
            <>
              <dt>Bright Star Catalogue</dt>
              <dd>HR {star.catalogIds.hr}</dd>
            </>
          ) : null}
          {star.catalogIds.hd ? (
            <>
              <dt>Henry Draper</dt>
              <dd>HD {star.catalogIds.hd}</dd>
            </>
          ) : null}
          <dt>Position (J2000)</dt>
          <dd>
            RA {star.ra.toFixed(3)}° · Dec {star.dec.toFixed(3)}°
          </dd>
          <dt>Spectral type</dt>
          <dd>{star.spectralType ?? "—"}</dd>
        </dl>
      </section>

      {siblings.length ? (
        <section>
          <h2>Also in {star.constellationName}</h2>
          <ul className="learn-list">
            {siblings.map((s) => (
              <li key={s.id}>
                <Link href={`/learn/stars/${s.id}`}>{s.name ?? s.designation}</Link>
                <span className="muted"> — mag {s.apparentMagnitude.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </LearnShell>
  );
}
