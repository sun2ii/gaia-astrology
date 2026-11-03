"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ChartLayers } from "@/components/SkyChart";
import { PLAY_SPEEDS } from "@/lib/time";
import { type Mat3, isIdentity, northHeadingDeg } from "@/lib/chart/view";
import { VIEW_MODES, type ViewMode } from "@/lib/chart/presets";

export type ToolbarDrawer = "stars" | "astrology" | "birth" | "upcoming" | "observer" | "about";

type Props = {
  layers: ChartLayers;
  onToggleLayer: (key: keyof ChartLayers) => void;
  drawer: string | null;
  onToggleDrawer: (which: ToolbarDrawer) => void;
  playing: boolean;
  onTogglePlay: () => void;
  speedIndex: number;
  onSpeedChange: (index: number) => void;
  onStep: (deltaMs: number) => void;
  onResetToNow: () => void;
  view: Mat3;
  viewMode: ViewMode;
  onViewMode: (mode: ViewMode) => void;
  /** Name of the overhead view: where the observer stands. */
  homeLabel: string;
};

/** One unit for everything: the speed sets how far ◀ ▶ nudge the clock. */
function stepFor(speedIndex: number): { ms: number; label: string } {
  const speed = PLAY_SPEEDS[speedIndex];
  if (speed.factor === 1) return { ms: 10 * 60_000, label: "10 minutes" };
  return { ms: speed.factor * 1000, label: speed.label.replace(/ \/ s$/, "") };
}

type Menu = "layers" | "panels" | "speed" | "view" | null;

/**
 * The instrument rail. A vertical column of round keys on the right of the
 * chart (a row along the bottom on phones). Menus open as small panels beside
 * the key that owns them; the play key is the one piece of ornament — its
 * bezel turns while the sky is running.
 */
export function Toolbar({
  layers,
  onToggleLayer,
  drawer,
  onToggleDrawer,
  playing,
  onTogglePlay,
  speedIndex,
  onSpeedChange,
  onStep,
  onResetToNow,
  view,
  viewMode,
  onViewMode,
  homeLabel,
}: Props) {
  const [menu, setMenu] = useState<Menu>(null);
  const root = useRef<HTMLElement>(null);
  const step = stepFor(speedIndex);
  const toggleMenu = (m: Menu) => setMenu((cur) => (cur === m ? null : m));

  // Click outside or Escape closes any open menu.
  useEffect(() => {
    if (!menu) return;
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null);
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  const panelOpen = (which: ToolbarDrawer) => drawer === which;
  const anyPanel = (["stars", "astrology", "birth", "upcoming", "observer", "about"] as const).some(panelOpen);

  return (
    <nav className="rail" aria-label="Toolbar" ref={root}>
      {/* Top group: Layers, Now, Viewpoint */}
      <div className="rail-group">
        <Key label="Layers" active={menu === "layers"} expanded={menu === "layers"} onClick={() => toggleMenu("layers")}>
          <Icon.layers />
        </Key>
        {menu === "layers" ? (
          <Flyout title="Show on the chart">
            <Row lit={layers.stars} onClick={() => onToggleLayer("stars")} icon={<Icon.star />} label="Stars" />
            <Row lit={layers.constellations} onClick={() => onToggleLayer("constellations")} icon={<Icon.constellation />} label="Constellation figures" />
            <Row lit={layers.planets} onClick={() => onToggleLayer("planets")} icon={<Icon.planet />} label="Sun, Moon and planets" />
            <Row lit={layers.labels} onClick={() => onToggleLayer("labels")} icon={<Icon.tag />} label="Names" />
            <Row lit={layers.zodiac} onClick={() => onToggleLayer("zodiac")} icon={<Icon.zodiac />} label="Zodiac band" />
            <Row lit={layers.earth} onClick={() => onToggleLayer("earth")} icon={<Icon.earth />} label="Earth" />
            <Row lit={layers.sky} onClick={() => onToggleLayer("sky")} icon={<Icon.shell />} label="Sky shell" />
          </Flyout>
        ) : null}

        <Key label="Back to now" onClick={onResetToNow}>
          <Icon.now />
        </Key>

        <Key label="Viewpoint" active={menu === "view" || !isIdentity(view, 1e-4)} expanded={menu === "view"} onClick={() => toggleMenu("view")}>
          <span className="rail-compass" style={{ transform: `rotate(${northHeadingDeg(view)}deg)` }}>
            <Icon.north />
          </span>
        </Key>
        {menu === "view" ? (
          <Flyout title="Look from" align="bottom">
            {VIEW_MODES.map((m) => (
              <Row
                key={m.mode}
                lit={viewMode === m.mode}
                radio
                onClick={() => {
                  onViewMode(m.mode);
                  setMenu(null);
                }}
                label={m.mode === "overhead" ? `Pin ${homeLabel}` : m.label}
              />
            ))}
          </Flyout>
        ) : null}
      </div>

      {/* Bottom group: Play/Pause, Speed */}
      <div className="rail-group rail-time">
        <button
          type="button"
          className={`rail-play${playing ? " playing" : ""}`}
          onClick={onTogglePlay}
          aria-pressed={playing}
          aria-label={playing ? "Pause the sky" : "Run the sky"}
          data-tip={playing ? "Pause" : `Run at ${PLAY_SPEEDS[speedIndex].label}`}
        >
          <svg className="rail-bezel" viewBox="0 0 64 64" aria-hidden="true">
            <circle className="rail-bezel-ring" cx="32" cy="32" r="29" />
            {Array.from({ length: 24 }, (_, i) => {
              const a = (i / 24) * Math.PI * 2;
              const long = i % 6 === 0;
              const r1 = long ? 24 : 26.5;
              return (
                <line
                  key={i}
                  className={long ? "rail-tick rail-tick-long" : "rail-tick"}
                  x1={32 + r1 * Math.cos(a)}
                  y1={32 + r1 * Math.sin(a)}
                  x2={32 + 29 * Math.cos(a)}
                  y2={32 + 29 * Math.sin(a)}
                />
              );
            })}
          </svg>
          <span className="rail-play-glyph">{playing ? <Icon.pause /> : <Icon.play />}</span>
        </button>

        <Key label="Speed" active={menu === "speed"} expanded={menu === "speed"} onClick={() => toggleMenu("speed")} compact>
          <span className="rail-speed-text">{speedText(speedIndex)}</span>
        </Key>
        {menu === "speed" ? (
          <Flyout title="Clock speed">
            {PLAY_SPEEDS.map((s, i) => (
              <Row key={s.label} lit={i === speedIndex} radio onClick={() => { onSpeedChange(i); setMenu(null); }} label={s.label === "real time" ? "Real time" : `${s.label.replace(" / s", "")} every second`} />
            ))}
          </Flyout>
        ) : null}
      </div>
    </nav>
  );
}

function speedText(i: number): string {
  const f = PLAY_SPEEDS[i].factor;
  if (f === 1) return "1×";
  if (f < 3600) return `${f / 60}m`;
  if (f < 86_400) return `${f / 3600}h`;
  return `${f / 86_400}d`;
}

function Key({
  label,
  active,
  expanded,
  compact,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  expanded?: boolean;
  compact?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`rail-key${active ? " active" : ""}${compact ? " compact" : ""}`}
      onClick={onClick}
      aria-label={label}
      aria-pressed={expanded === undefined ? undefined : expanded}
      data-tip={label}
    >
      {children}
    </button>
  );
}

function Flyout({ title, children, align = "top" }: { title: string; children: ReactNode; align?: "top" | "bottom" }) {
  return (
    <div className={`rail-flyout${align === "bottom" ? " rail-flyout-up" : ""}`} role="group" aria-label={title}>
      <p className="rail-flyout-title">{title}</p>
      {children}
    </div>
  );
}

function Row({
  lit,
  radio,
  onClick,
  icon,
  label,
  hint,
  badge,
}: {
  lit: boolean;
  radio?: boolean;
  onClick: () => void;
  icon?: ReactNode;
  label: string;
  hint?: string;
  badge?: string;
}) {
  return (
    <button type="button" className={`rail-row${lit ? " lit" : ""}${hint ? " with-hint" : ""}`} onClick={onClick} role={radio ? "radio" : "switch"} aria-checked={lit}>
      {icon ? <span className="rail-row-icon">{icon}</span> : null}
      <span className="rail-row-text">
        <span className="rail-row-label">{label}</span>
        {hint ? <span className="rail-row-hint">{hint}</span> : null}
      </span>
      {badge ? <span className="rail-badge">{badge}</span> : null}
      <span className="rail-lamp" aria-hidden="true" />
    </button>
  );
}

/* Line icons, 20×20, 1.5px stroke. Drawn here so the rail owns its own look. */
const svg = (children: ReactNode) => (
  <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const Icon = {
  layers: () => svg(<><path d="M10 3.5 17 7l-7 3.5L3 7l7-3.5Z" /><path d="m3 10.5 7 3.5 7-3.5" /><path d="m3 14 7 3.5 7-3.5" /></>),
  panels: () => svg(<><rect x="3" y="3.5" width="14" height="13" rx="2" /><path d="M11 3.5v13" /><path d="M13.5 7.5h1M13.5 10h1" /></>),
  star: () => svg(<path d="m10 2.8 2.1 4.4 4.8.6-3.5 3.3.9 4.8L10 13.6l-4.3 2.3.9-4.8L3.1 7.8l4.8-.6L10 2.8Z" />),
  constellation: () => svg(<><circle cx="4.5" cy="14.5" r="1.3" /><circle cx="9" cy="6" r="1.3" /><circle cx="15.5" cy="9.5" r="1.3" /><circle cx="13" cy="16" r="1.3" /><path d="m5.3 13.4 3-6.3M10.2 6.7l4.1 2.2M14.9 10.7l-1.4 4M5.7 14.7l6-.2" /></>),
  planet: () => svg(<><circle cx="10" cy="10" r="4" /><path d="M3.2 12.6c-1 1.6-.9 2.8.1 3.3 1.8.9 6.3-.9 10-3.9 3.7-3 5.2-6.3 3.5-7.3-.9-.5-2.3-.2-3.8.6" /></>),
  tag: () => svg(<><path d="M3 4.5h7l6.5 6.5-5.5 5.5L4.5 10V4.5Z" /><circle cx="6.5" cy="7.5" r="1" fill="currentColor" stroke="none" /></>),
  zodiac: () => svg(<><circle cx="10" cy="10" r="7" /><circle cx="10" cy="10" r="3.5" /><path d="M10 3v3.5M17 10h-3.5M10 17v-3.5M3 10h3.5" /></>),
  earth: () => svg(<><circle cx="10" cy="10" r="7" /><path d="M3.3 8.2c1.6.3 2.4 1.3 2.2 2.6-.2 1.3.8 1.9 2 1.8 1.3-.1 1.9.9 1.7 2.1M9.4 3.2c-.4 1.4.3 2.3 1.6 2.4 1.3.1 1.9 1 1.5 2.2-.4 1.2.4 2 1.7 2 1.1 0 2-.3 2.7-.9" /></>),
  shell: () => svg(<><circle cx="10" cy="10" r="7" strokeDasharray="2.5 2.5" /><circle cx="10" cy="10" r="3.2" /></>),
  list: () => svg(<><path d="M7 5.5h10M7 10h10M7 14.5h10" /><circle cx="3.8" cy="5.5" r=".9" fill="currentColor" stroke="none" /><circle cx="3.8" cy="10" r=".9" fill="currentColor" stroke="none" /><circle cx="3.8" cy="14.5" r=".9" fill="currentColor" stroke="none" /></>),
  sun: () => svg(<><circle cx="10" cy="10" r="3.2" /><path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M4.7 15.3l1.4-1.4M13.9 6.1l1.4-1.4" /></>),
  chart: () => svg(<><circle cx="10" cy="10" r="7" /><path d="M10 3v14M3 10h14M5.1 5.1l9.8 9.8M14.9 5.1l-9.8 9.8" /></>),
  calendar: () => svg(<><rect x="3" y="4.5" width="14" height="12" rx="2" /><path d="M3 8.5h14M7 3v3M13 3v3" /><circle cx="10" cy="12.5" r="1" fill="currentColor" stroke="none" /></>),
  pin: () => svg(<><path d="M10 17.5s5-4.6 5-8.5a5 5 0 0 0-10 0c0 3.9 5 8.5 5 8.5Z" /><circle cx="10" cy="9" r="1.8" /></>),
  help: () => svg(<><circle cx="10" cy="10" r="7" /><path d="M7.8 8a2.2 2.2 0 1 1 3.1 2c-.7.4-.9.8-.9 1.5" /><circle cx="10" cy="14" r=".8" fill="currentColor" stroke="none" /></>),
  book: () => svg(<><path d="M3.5 4.5c2.2-.8 4.3-.8 6.5.4 2.2-1.2 4.3-1.2 6.5-.4v11c-2.2-.8-4.3-.8-6.5.4-2.2-1.2-4.3-1.2-6.5-.4v-11Z" /><path d="M10 4.9v11" /></>),
  arrow: () => svg(<path d="M8 5.5 12.5 10 8 14.5" />),
  back: () => svg(<><path d="M11.5 5 6.5 10l5 5" /><path d="M14.5 5v10" /></>),
  forward: () => svg(<><path d="m8.5 5 5 5-5 5" /><path d="M5.5 5v10" /></>),
  play: () => svg(<path d="M7 4.5v11l9-5.5-9-5.5Z" fill="currentColor" stroke="none" />),
  pause: () => svg(<><rect x="5" y="4.5" width="3.5" height="11" rx=".8" fill="currentColor" stroke="none" /><rect x="11.5" y="4.5" width="3.5" height="11" rx=".8" fill="currentColor" stroke="none" /></>),
  north: () => svg(<><path d="m10 2.5 3.2 8.2L10 9.2l-3.2 1.5L10 2.5Z" fill="currentColor" stroke="none" /><path d="m10 17.5-3.2-6.8L10 12.2l3.2-1.5-3.2 6.8Z" /></>),
  now: () => svg(<><circle cx="10" cy="10" r="7" /><path d="M10 6v4.3l2.8 1.7" /></>),
};
