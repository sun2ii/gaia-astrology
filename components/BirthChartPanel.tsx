"use client";

import Link from "next/link";
import { useState } from "react";
import { Term } from "@/components/Term";
import { BODY_INFO, type SolarSystemBodyId } from "@/lib/astronomy/solarSystem";
import type { Observer } from "@/lib/astronomy/types";
import {
  ANGLE_MEANING,
  ASPECT_MEANING,
  BODY_MEANING,
  HOUSE_MEANING,
  INTERPRETATION_DISCLAIMER,
  SIGN_MEANING,
  aspectSentence,
  bodyInHouse,
  bodyInSign,
  retrogradeNote,
} from "@/lib/astrology/interpretations";
import { findTransits, getNatalChart, type BirthData, type NatalChart, type Transit } from "@/lib/astrology/natal";
import type { AstrologyState } from "@/lib/astrology/types";
import { ZODIAC_SYMBOLS } from "@/lib/astrology/types";
import { formatZodiacPosition } from "@/lib/astrology/zodiac";
import { COMMON_TIME_ZONES, localTimeZoneName, zonedLocalToUtc } from "@/lib/time";

/** What the form holds. Saved in the browser only (localStorage), never sent anywhere. */
export type BirthForm = {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  timeKnown: boolean;
  timeZone: string;
  latitude: string;
  longitude: string;
  placeLabel: string;
};

const STORAGE_KEY = "gaia.birth.v1";
const LEVEL_KEY = "gaia.birth.level.v1";

export function loadBirthForm(): BirthForm | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BirthForm) : null;
  } catch {
    return null;
  }
}

function saveBirthForm(form: BirthForm) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  } catch {
    /* storage unavailable: the chart still works for this session */
  }
}

function clearBirthForm() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function loadLevel(): Level {
  try {
    const n = Number(window.localStorage.getItem(LEVEL_KEY));
    return n >= 0 && n <= 3 ? (n as Level) : 0;
  } catch {
    return 0;
  }
}

function saveLevel(level: Level) {
  try {
    window.localStorage.setItem(LEVEL_KEY, String(level));
  } catch {
    /* ignore */
  }
}

export function emptyBirthForm(observer: Observer): BirthForm {
  return {
    date: "",
    time: "12:00",
    timeKnown: true,
    timeZone: localTimeZoneName(),
    latitude: String(observer.latitude),
    longitude: String(observer.longitude),
    placeLabel: "",
  };
}

/** Turns the form into BirthData, or null if incomplete/invalid. */
export function birthDataFromForm(form: BirthForm): BirthData | null {
  const [y, m, d] = form.date.split("-").map(Number);
  const [h, min] = (form.timeKnown ? form.time : "12:00").split(":").map(Number);
  if ([y, m, d, h, min].some((n) => !Number.isFinite(n))) return null;
  const instant = zonedLocalToUtc({ year: y, month: m, day: d, hour: h, minute: min }, form.timeZone);
  const latitude = Number(form.latitude);
  const longitude = Number(form.longitude);
  if (!instant || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { instant, location: { latitude, longitude }, timeKnown: form.timeKnown, placeLabel: form.placeLabel || undefined };
}

/**
 * Progressive disclosure. Each level adds one layer, in the order beginner
 * guides recommend: Big Three → Venus & Mars → the rest of the personal
 * planets and the two simplest aspects → everything (advanced).
 */
export type Level = 0 | 1 | 2 | 3;

const LEVEL_INFO: Record<Level, { title: string; why: string; next?: string }> = {
  0: { title: "Your Big Three", why: "Start here. Most of what people casually say about a chart comes from these three.", next: "Add Venus and Mars" },
  1: { title: "Love and drive", why: "Venus (how you love) and Mars (how you act) are the next two that describe you personally.", next: "Add mind, growth, discipline" },
  2: { title: "The personal planets", why: "Mercury, Jupiter and Saturn complete the picture of you. Two simple aspects are shown: planets together, and planets opposite.", next: "Show everything (advanced)" },
  3: { title: "The whole chart", why: "Outer planets are generational; houses and every aspect add detail. Useful once the basics feel familiar." },
};

const LEVEL_BODIES: Record<Level, SolarSystemBodyId[]> = {
  0: ["sun", "moon"],
  1: ["sun", "moon", "venus", "mars"],
  2: ["sun", "moon", "venus", "mars", "mercury", "jupiter", "saturn"],
  3: ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"],
};

/** Natal points that count as "about you" for the one-line transit headline. */
const PERSONAL: SolarSystemBodyId[] = ["sun", "moon", "venus", "mars"];

/** The single most relevant transit right now: tightest orb to a personal point, slow movers preferred over the Moon. */
export function headlineTransit(transits: Transit[]): Transit | null {
  const candidates = transits.filter((t) => PERSONAL.includes(t.natal) && t.transiting !== "moon");
  return candidates[0] ?? transits.find((t) => PERSONAL.includes(t.natal)) ?? null;
}

type Props = {
  form: BirthForm;
  onChange: (form: BirthForm) => void;
  /** Today's sky, for transits. */
  now: AstrologyState;
  currentObserver: Observer;
  onClose: () => void;
};

export function BirthChartPanel({ form, onChange, now, currentObserver, onClose }: Props) {
  const [editing, setEditing] = useState(!form.date);
  const [level, setLevelState] = useState<Level>(() => loadLevel());
  const setLevel = (l: Level) => {
    setLevelState(l);
    saveLevel(l);
  };
  const birth = birthDataFromForm(form);
  const chart = birth ? getNatalChart(birth) : null;
  const transits = chart ? findTransits(now, chart) : [];
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (key: string) => setOpen((o) => (o === key ? null : key));

  const update = (patch: Partial<BirthForm>) => onChange({ ...form, ...patch });
  const zones = COMMON_TIME_ZONES.includes(form.timeZone as (typeof COMMON_TIME_ZONES)[number])
    ? COMMON_TIME_ZONES
    : [form.timeZone, ...COMMON_TIME_ZONES];

  return (
    <div className="drawer-panel birth">
      <div className="detail-header">
        <h2>YOUR BIRTH CHART</h2>
        <button type="button" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      {editing || !chart ? (
        <BirthForm form={form} update={update} zones={zones} currentObserver={currentObserver} onChange={onChange} onSaved={() => setEditing(false)} />
      ) : (
        <ChartView
          form={form}
          birth={birth!}
          chart={chart}
          transits={transits}
          level={level}
          setLevel={setLevel}
          open={open}
          toggle={toggle}
          onEdit={() => setEditing(true)}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Form
 * ------------------------------------------------------------------------- */

function BirthForm({
  form,
  update,
  zones,
  currentObserver,
  onChange,
  onSaved,
}: {
  form: BirthForm;
  update: (patch: Partial<BirthForm>) => void;
  zones: readonly string[];
  currentObserver: Observer;
  onChange: (form: BirthForm) => void;
  onSaved: () => void;
}) {
  return (
    <form
      className="controls"
      onSubmit={(e) => {
        e.preventDefault();
        if (birthDataFromForm(form)) {
          saveBirthForm(form);
          onSaved();
        }
      }}
    >
      <p className="detail-note">
        A birth chart is simply the sky at the moment and place you were born. Your <Term k="sun sign" /> needs only the date;
        your <Term k="rising sign" /> needs the time and place too. This stays in your browser and is never sent anywhere.
      </p>
      <div className="controls-row">
        <label>
          <span>Birth date</span>
          <input type="date" value={form.date} onChange={(e) => update({ date: e.target.value })} required />
        </label>
        <label>
          <span>Birth time</span>
          <input type="time" value={form.time} disabled={!form.timeKnown} onChange={(e) => update({ time: e.target.value })} />
        </label>
        <label className="check">
          <input type="checkbox" checked={!form.timeKnown} onChange={(e) => update({ timeKnown: !e.target.checked })} />
          <span>I don&rsquo;t know my birth time</span>
        </label>
      </div>
      <div className="controls-row">
        <label>
          <span>Time zone of birth place</span>
          <select value={form.timeZone} onChange={(e) => update({ timeZone: e.target.value })}>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>
            Place name <small>(optional)</small>
          </span>
          <input type="text" value={form.placeLabel} placeholder="Sacramento, CA" onChange={(e) => update({ placeLabel: e.target.value })} />
        </label>
      </div>
      <div className="controls-row">
        <label>
          <span>
            Birth latitude <small>(° north)</small>
          </span>
          <input type="number" step="any" min={-90} max={90} value={form.latitude} onChange={(e) => update({ latitude: e.target.value })} />
        </label>
        <label>
          <span>
            Birth longitude <small>(° east)</small>
          </span>
          <input type="number" step="any" min={-180} max={180} value={form.longitude} onChange={(e) => update({ longitude: e.target.value })} />
        </label>
        <button
          type="button"
          className="toggle"
          onClick={() => update({ latitude: String(currentObserver.latitude), longitude: String(currentObserver.longitude) })}
        >
          Use current observer location
        </button>
      </div>
      <div className="controls-row">
        <button type="submit" className="toggle active" disabled={!birthDataFromForm(form)}>
          Show my chart
        </button>
        {form.date ? (
          <button
            type="button"
            className="toggle"
            onClick={() => {
              clearBirthForm();
              onChange(emptyBirthForm(currentObserver));
            }}
          >
            Clear
          </button>
        ) : null}
      </div>
      {form.date && !birthDataFromForm(form) ? <p className="error">Please check the date, time zone, latitude and longitude.</p> : null}
    </form>
  );
}

/* ---------------------------------------------------------------------------
 * Chart view (progressive)
 * ------------------------------------------------------------------------- */

function ChartView({
  form,
  birth,
  chart,
  transits,
  level,
  setLevel,
  open,
  toggle,
  onEdit,
}: {
  form: BirthForm;
  birth: BirthData;
  chart: NatalChart;
  transits: Transit[];
  level: Level;
  setLevel: (l: Level) => void;
  open: string | null;
  toggle: (key: string) => void;
  onEdit: () => void;
}) {
  const byBody = new Map(chart.planets.map((p) => [p.body, p]));
  const sun = byBody.get("sun")!;
  const moon = byBody.get("moon")!;
  const shownBodies = LEVEL_BODIES[level].filter((b) => b !== "sun" && b !== "moon");
  const info = LEVEL_INFO[level];
  const headline = headlineTransit(transits);
  const simpleAspects = chart.aspects.filter((a) => a.name === "conjunction" || a.name === "opposition");
  const aspectsToShow = level === 3 ? chart.aspects : level === 2 ? simpleAspects : [];

  return (
    <>
      <p className="detail-designation">
        {birth.instant.toLocaleString(undefined, { dateStyle: "long", timeStyle: birth.timeKnown ? "short" : undefined, timeZone: form.timeZone })}
        {form.placeLabel ? ` · ${form.placeLabel}` : ""} ·{" "}
        <button type="button" className="link-button" onClick={onEdit}>
          edit
        </button>
      </p>

      {/* Level 0: the Big Three, always visible */}
      <h3>
        <Term k="big three">Your Big Three</Term>
      </h3>
      <div className="big-three">
        <BigCard
          k="p-sun"
          label="Sun sign"
          termKey="sun sign"
          sign={sun.zodiac.sign}
          sub={BODY_MEANING.sun.role}
          open={open}
          toggle={toggle}
          note={`${bodyInSign("sun", sun.zodiac.sign)} ${BODY_MEANING.sun.explain}`}
          href={`/learn/placements/sun-in-${sun.zodiac.sign.toLowerCase()}`}
        />
        <BigCard
          k="p-moon"
          label="Moon sign"
          termKey="moon sign"
          sign={moon.zodiac.sign}
          sub={BODY_MEANING.moon.role}
          open={open}
          toggle={toggle}
          note={`${bodyInSign("moon", moon.zodiac.sign)} ${BODY_MEANING.moon.explain}`}
          href={`/learn/placements/moon-in-${moon.zodiac.sign.toLowerCase()}`}
        />
        {chart.angles ? (
          <BigCard
            k="a-ascendant"
            label="Rising sign"
            termKey="rising sign"
            sign={chart.angles.ascendant.sign}
            sub="first impression"
            open={open}
            toggle={toggle}
            note={`${ANGLE_MEANING.ascendant.explain} With ${chart.angles.ascendant.sign} rising you come across as ${SIGN_MEANING[chart.angles.ascendant.sign].keywords}.`}
            href={`/learn/signs/${chart.angles.ascendant.sign.toLowerCase()}`}
          />
        ) : (
          <div className="big-card">
            <span className="big-label">
              <Term k="rising sign">Rising sign</Term>
            </span>
            <span className="muted">needs a birth time</span>
          </div>
        )}
      </div>

      {/* One-line transit headline */}
      {headline ? (
        <div className="headline">
          <span className="big-label">
            Today&rsquo;s biggest <Term k="transit">transit</Term> for you
          </span>
          <p>
            {BODY_INFO[headline.transiting].symbol} {BODY_INFO[headline.transiting].name} {headline.symbol} your {BODY_INFO[headline.natal].name} —{" "}
            {ASPECT_MEANING[headline.name].explain}. ({headline.orb.toFixed(1)}° <Term k="orb" />, {headline.applying ? "building" : "fading"})
          </p>
        </div>
      ) : (
        <div className="headline">
          <span className="big-label">Today&rsquo;s biggest transit for you</span>
          <p className="muted">Nothing close to exact today — a quiet sky for your chart.</p>
        </div>
      )}

      {/* Deeper levels */}
      {shownBodies.length > 0 ? (
        <>
          <h3>{info.title}</h3>
          <ul className="member-list">
            {shownBodies.map((id) => {
              const p = byBody.get(id)!;
              const key = `p-${id}`;
              return (
                <li key={key}>
                  <button type="button" className={`member-row${open === key ? " open" : ""}`} onClick={() => toggle(key)}>
                    <span>
                      {BODY_INFO[id].symbol} {BODY_INFO[id].name}
                      <small> {BODY_MEANING[id].role}</small>
                    </span>
                    <span className="member-where">
                      {ZODIAC_SYMBOLS[p.zodiac.sign]} {formatZodiacPosition(p.zodiac, false)}
                      {p.retrograde ? " ℞" : ""}
                      {level === 3 && p.house ? ` · H${p.house.number}` : ""}
                    </span>
                  </button>
                  {open === key ? (
                    <div className="explain">
                      <p>{bodyInSign(id, p.zodiac.sign)}</p>
                      {level === 3 && p.house ? <p>{bodyInHouse(id, p.house.number)}</p> : null}
                      {p.retrograde ? (
                        <p>
                          {retrogradeNote(id)} <Term k="retrograde">What is retrograde?</Term>
                        </p>
                      ) : null}
                      <p className="muted">{BODY_MEANING[id].explain}</p>
                      <Link className="read-more" href={`/learn/placements/${id}-in-${p.zodiac.sign.toLowerCase()}`}>
                        Read the full {BODY_INFO[id].name} in {p.zodiac.sign} page →
                      </Link>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </>
      ) : null}

      {aspectsToShow.length > 0 ? (
        <>
          <h3>
            {level === 3 ? "All " : "Simple "}
            <Term k="aspect">aspects</Term> in your chart
          </h3>
          <ul className="member-list">
            {aspectsToShow.map((a) => {
              const key = `n-${a.bodies[0]}-${a.name}-${a.bodies[1]}`;
              return (
                <li key={key}>
                  <button type="button" className={`member-row${open === key ? " open" : ""}`} onClick={() => toggle(key)}>
                    <span>
                      {BODY_INFO[a.bodies[0]].symbol} {a.symbol} {BODY_INFO[a.bodies[1]].symbol} {BODY_INFO[a.bodies[0]].name} {a.name}{" "}
                      {BODY_INFO[a.bodies[1]].name}
                    </span>
                    <span className="member-where">{a.orb.toFixed(1)}°</span>
                  </button>
                  {open === key ? (
                    <div className="explain">
                      <p>{aspectSentence(a.bodies[0], a.name, a.bodies[1])}</p>
                      <p className="muted">
                        A {a.name} is {ASPECT_MEANING[a.name].tone}. The smaller the <Term k="orb" />, the stronger it is felt.
                      </p>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </>
      ) : null}

      {level === 3 ? (
        <>
          {chart.angles ? (
            <>
              <h3>Angles</h3>
              <ul className="member-list">
                {(["ascendant", "midheaven"] as const).map((k) => {
                  const key = `a-${k}`;
                  const pos = chart.angles![k];
                  return (
                    <li key={key}>
                      <button type="button" className={`member-row${open === key ? " open" : ""}`} onClick={() => toggle(key)}>
                        <span>{ANGLE_MEANING[k].name}</span>
                        <span className="member-where">
                          {ZODIAC_SYMBOLS[pos.sign]} {formatZodiacPosition(pos, false)}
                        </span>
                      </button>
                      {open === key ? (
                        <div className="explain">
                          <p>{ANGLE_MEANING[k].explain}</p>
                          <p>
                            {pos.sign}: {SIGN_MEANING[pos.sign].keywords}.
                          </p>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>

              <h3>
                <Term k="house">Houses</Term> (whole-sign)
              </h3>
              <ul className="member-list compact">
                {chart.houses!.map((h) => (
                  <li key={h.number}>
                    <button type="button" className={`member-row${open === `h-${h.number}` ? " open" : ""}`} onClick={() => toggle(`h-${h.number}`)}>
                      <span>
                        House {h.number} <small>{HOUSE_MEANING[h.number].theme}</small>
                      </span>
                      <span className="member-where">
                        {ZODIAC_SYMBOLS[h.sign]} {h.sign}
                      </span>
                    </button>
                    {open === `h-${h.number}` ? (
                      <div className="explain">
                        <p>
                          House {h.number} covers {HOUSE_MEANING[h.number].explain}. With {h.sign} here, that area of life tends to be{" "}
                          {SIGN_MEANING[h.sign].keywords}.
                        </p>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          <h3>
            All <Term k="transit">transits</Term> right now
          </h3>
          {transits.length === 0 ? (
            <p className="detail-note">No transits within 3° right now.</p>
          ) : (
            <ul className="member-list">
              {transits.map((t) => {
                const key = `t-${t.transiting}-${t.name}-${t.natal}`;
                return (
                  <li key={key}>
                    <button type="button" className={`member-row${open === key ? " open" : ""}`} onClick={() => toggle(key)}>
                      <span>
                        {BODY_INFO[t.transiting].symbol} {t.symbol} {BODY_INFO[t.natal].symbol} {BODY_INFO[t.transiting].name} {t.name} your{" "}
                        {BODY_INFO[t.natal].name}
                      </span>
                      <span className="member-where">
                        {t.orb.toFixed(1)}° · {t.applying ? "building" : "fading"}
                      </span>
                    </button>
                    {open === key ? (
                      <div className="explain">
                        <p>{aspectSentence(t.transiting, t.name, t.natal, false)}</p>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      ) : null}

      {/* Go deeper / back */}
      <div className="deeper">
        {info.next ? (
          <button type="button" className="toggle primary" onClick={() => setLevel((level + 1) as Level)}>
            {info.next} →
          </button>
        ) : null}
        {level > 0 ? (
          <button type="button" className="toggle" onClick={() => setLevel((level - 1) as Level)}>
            ← Simpler
          </button>
        ) : null}
      </div>
      <p className="deeper-why">{info.why}</p>

      <p className="detail-note">{INTERPRETATION_DISCLAIMER}</p>
    </>
  );
}

function BigCard({
  k,
  label,
  termKey,
  sign,
  sub,
  note,
  href,
  open,
  toggle,
}: {
  k: string;
  label: string;
  termKey: "sun sign" | "moon sign" | "rising sign";
  sign: keyof typeof ZODIAC_SYMBOLS;
  sub: string;
  note: string;
  href?: string;
  open: string | null;
  toggle: (key: string) => void;
}) {
  const isOpen = open === k;
  return (
    <div className={`big-card${isOpen ? " wide" : ""}`}>
      <span className="big-label">
        <Term k={termKey}>{label}</Term>
      </span>
      <button type="button" className="link-button big-value" onClick={() => toggle(k)} aria-expanded={isOpen}>
        {ZODIAC_SYMBOLS[sign]} {sign}
      </button>
      <span className="muted">{sub}</span>
      {isOpen ? (
        <>
          <p className="big-note">{note}</p>
          {href ? (
            <Link className="read-more" href={href}>
              Read the full page →
            </Link>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
