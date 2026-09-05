"use client";

import { useState } from "react";
import { Term } from "@/components/Term";
import { findUpcomingEvents, type SkyEvent } from "@/lib/astrology/events";
import type { NatalChart } from "@/lib/astrology/natal";
import { BODY_INFO } from "@/lib/astronomy/solarSystem";

type Props = {
  /** Scan starts here (the app's current time). */
  from: Date;
  /** Birth chart, if the user has entered one. */
  natal: NatalChart | null;
  days?: number;
};

const EVENT_ICON: Record<SkyEvent["kind"], string> = {
  lunation: "☽",
  ingress: "→",
  station: "℞",
  transit: "✦",
  return: "☉",
};

/** Beginner filter: the handful of events most guides say to watch first. */
function isBigOne(e: SkyEvent): boolean {
  if (e.kind === "lunation" || e.kind === "station" || e.kind === "return") return true;
  if (e.kind === "ingress") return e.body === "sun";
  if (e.kind === "transit") {
    const slowOrSun = ["sun", "mars", "jupiter", "saturn"].includes(e.body);
    const core = ["sun", "moon", "ascendant"].includes(e.natal);
    return slowOrSun && core;
  }
  return false;
}

/**
 * Mount this with a `key` that changes when the day or the birth data changes:
 * the scan (~1 s for 60 days) runs once per mount, never per render.
 */
export function UpcomingPanel({ from, natal, days = 60 }: Props) {
  const [events] = useState(() => findUpcomingEvents(from, days, natal));
  const [showAll, setShowAll] = useState(false);
  const [open, setOpen] = useState<number | null>(null);

  const shown = showAll ? events : events.filter(isBigOne);

  // Group by local calendar day.
  const groups: Array<{ day: string; items: Array<{ e: SkyEvent; i: number }> }> = [];
  shown.forEach((e) => {
    const i = events.indexOf(e);
    const day = e.date.toLocaleDateString(undefined, { weekday: "short", month: "long", day: "numeric" });
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push({ e, i });
    else groups.push({ day, items: [{ e, i }] });
  });

  return (
    <div className="drawer-panel upcoming">
      <p className="detail-note">
        The next {days} days, worked out from where the planets will be. {natal ? "Events marked ✦ are measured against your birth chart." : "Enter a birth chart to also see when planets hit your Sun, Moon and rising sign."}
      </p>
      <div className="deeper">
        <button type="button" className="toggle" onClick={() => setShowAll((s) => !s)} aria-expanded={showAll}>
          {showAll ? "Just the big ones" : `Show everything (${events.length})`}
        </button>
      </div>

      {groups.length === 0 ? <p className="empty">Nothing in this window.</p> : null}
      {groups.map((g) => (
        <section key={g.day} className="event-day">
          <h3>{g.day}</h3>
          <ul className="member-list">
            {g.items.map(({ e, i }) => (
              <li key={i}>
                <button type="button" className={`member-row${open === i ? " open" : ""}`} onClick={() => setOpen((o) => (o === i ? null : i))}>
                  <span>
                    <span className={`event-icon ${e.kind}`}>{EVENT_ICON[e.kind]}</span> {e.title}
                  </span>
                  <span className="member-where">{e.date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span>
                </button>
                {open === i ? (
                  <div className="explain">
                    <p>{e.note}</p>
                    {e.kind === "transit" ? (
                      <p className="muted">
                        A <Term k="transit" /> is exact for a moment and felt for days around it (longer for slow planets like{" "}
                        {BODY_INFO.jupiter.name} and {BODY_INFO.saturn.name}).
                      </p>
                    ) : null}
                    {e.kind === "station" ? (
                      <p className="muted">
                        <Term k="retrograde">What retrograde means.</Term>
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="detail-note">Times are shown in your local time zone. Dates come from the same ephemeris as the star chart.</p>
    </div>
  );
}
