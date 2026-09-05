"use client";

import Link from "next/link";
import { useState } from "react";
import type { Star } from "@/lib/astronomy/types";

type Props = {
  stars: Star[];
  /** constellation abbreviation -> Latin name, for grouping. */
  constellationNames: Record<string, string>;
};

/** Searchable, groupable list of every star in the catalog. Client-side filter only. */
export function StarIndex({ stars, constellationNames }: Props) {
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<"constellation" | "brightness">("constellation");
  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? stars.filter((s) =>
        [s.name ?? "", s.designation, s.constellationName, s.constellation, `HIP ${s.catalogIds.hip}`, s.catalogIds.hr ? `HR ${s.catalogIds.hr}` : ""]
          .join(" ")
          .toLowerCase()
          .includes(needle),
      )
    : stars;

  if (group === "brightness") {
    const sorted = [...filtered].sort((a, b) => a.apparentMagnitude - b.apparentMagnitude);
    return (
      <>
        <Controls q={q} setQ={setQ} group={group} setGroup={setGroup} count={filtered.length} />
        <ol className="star-index">
          {sorted.map((s) => (
            <li key={s.id}>
              <StarRow star={s} />
            </li>
          ))}
        </ol>
      </>
    );
  }

  const byConst = new Map<string, Star[]>();
  for (const s of filtered) {
    const list = byConst.get(s.constellation) ?? [];
    list.push(s);
    byConst.set(s.constellation, list);
  }
  const groups = [...byConst.entries()].sort((a, b) => (constellationNames[a[0]] ?? a[0]).localeCompare(constellationNames[b[0]] ?? b[0]));

  return (
    <>
      <Controls q={q} setQ={setQ} group={group} setGroup={setGroup} count={filtered.length} />
      {groups.map(([abbr, list]) => (
        <section key={abbr} className="star-group">
          <h2>
            {constellationNames[abbr] ?? abbr} <span className="muted">· {list.length}</span>
          </h2>
          <ul className="star-index">
            {[...list].sort((a, b) => a.apparentMagnitude - b.apparentMagnitude).map((s) => (
              <li key={s.id}>
                <StarRow star={s} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

function Controls({ q, setQ, group, setGroup, count }: { q: string; setQ: (v: string) => void; group: string; setGroup: (g: "constellation" | "brightness") => void; count: number }) {
  return (
    <div className="star-index-controls">
      <input type="search" placeholder="Search a name, designation, or constellation…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="toolbar-group">
        <button type="button" className={`toggle${group === "constellation" ? " active" : ""}`} onClick={() => setGroup("constellation")}>
          By constellation
        </button>
        <button type="button" className={`toggle${group === "brightness" ? " active" : ""}`} onClick={() => setGroup("brightness")}>
          Brightest first
        </button>
      </div>
      <span className="muted">{count} stars</span>
    </div>
  );
}

function StarRow({ star }: { star: Star }) {
  return (
    <Link href={`/learn/stars/${star.id}`} className="star-index-row">
      <span className={`star-dot ${star.tier}`} style={{ width: `${Math.max(4, 12 - star.apparentMagnitude * 1.5)}px`, height: `${Math.max(4, 12 - star.apparentMagnitude * 1.5)}px` }} />
      <span className="star-index-name">
        {star.name ?? star.designation}
        {star.name ? <small> {star.designation}</small> : null}
      </span>
      <span className="muted">mag {star.apparentMagnitude.toFixed(2)}</span>
    </Link>
  );
}
