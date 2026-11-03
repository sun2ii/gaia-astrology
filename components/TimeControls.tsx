"use client";

import { PLAY_SPEEDS } from "@/lib/time";

type Props = {
  playing: boolean;
  /** Index into PLAY_SPEEDS. Also sets the unit the ◀ ▶ buttons step by. */
  speedIndex: number;
  onStep: (deltaMs: number) => void;
  onTogglePlay: () => void;
  onSpeedChange: (index: number) => void;
  onResetToNow: () => void;
};

/**
 * One unit for everything: "1 hour / s" means play advances an hour each
 * second, and ◀ ▶ nudge the clock by one hour. "Real time" would make the
 * buttons step one second, which is useless, so it steps 10 minutes instead.
 */
function stepFor(speedIndex: number): { ms: number; label: string } {
  const speed = PLAY_SPEEDS[speedIndex];
  if (speed.factor === 1) return { ms: 10 * 60_000, label: "10 minutes" };
  return { ms: speed.factor * 1000, label: speed.label.replace(/ \/ s$/, "") };
}

export function TimeControls({ playing, speedIndex, onStep, onTogglePlay, onSpeedChange, onResetToNow }: Props) {
  const step = stepFor(speedIndex);
  return (
    <div className="timebar" role="group" aria-label="Time controls">
      <button type="button" onClick={() => onStep(-step.ms)} aria-label={`Back ${step.label}`} title={`Back ${step.label}`}>
        ◀
      </button>
      <button type="button" onClick={() => onStep(step.ms)} aria-label={`Forward ${step.label}`} title={`Forward ${step.label}`}>
        ▶
      </button>

      <span className="timebar-divider" aria-hidden="true" />

      <button type="button" className={`timebar-play${playing ? " playing" : ""}`} onClick={onTogglePlay} aria-pressed={playing}>
        {playing ? "❚❚ Pause" : "▶ Play"}
      </button>
      <label className="timebar-select">
        <span>Speed</span>
        <select value={speedIndex} onChange={(e) => onSpeedChange(Number(e.target.value))}>
          {PLAY_SPEEDS.map((s, i) => (
            <option key={s.label} value={i}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      <span className="timebar-divider" aria-hidden="true" />

      <button type="button" onClick={onResetToNow}>
        Now
      </button>
    </div>
  );
}
