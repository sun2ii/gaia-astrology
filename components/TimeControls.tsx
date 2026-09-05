"use client";

import { PLAY_SPEEDS, TIME_STEPS } from "@/lib/time";

type Props = {
  playing: boolean;
  /** Index into PLAY_SPEEDS. */
  speedIndex: number;
  /** Index into TIME_STEPS. */
  stepIndex: number;
  onStep: (deltaMs: number) => void;
  onTogglePlay: () => void;
  onSpeedChange: (index: number) => void;
  onStepSizeChange: (index: number) => void;
  onResetToNow: () => void;
};

/**
 * The time bar: step the clock back/forward by a chosen amount, or let it run
 * at a chosen speed. Stepping by one sidereal day is the "see the stars come
 * back to the same place" button.
 */
export function TimeControls({
  playing,
  speedIndex,
  stepIndex,
  onStep,
  onTogglePlay,
  onSpeedChange,
  onStepSizeChange,
  onResetToNow,
}: Props) {
  const step = TIME_STEPS[stepIndex];
  return (
    <div className="timebar" role="group" aria-label="Time controls">
      <button type="button" onClick={() => onStep(-step.ms)} aria-label={`Back ${step.label}`} title={`Back ${step.label}`}>
        ◀
      </button>
      <label className="timebar-select">
        <span>Step</span>
        <select value={stepIndex} onChange={(e) => onStepSizeChange(Number(e.target.value))}>
          {TIME_STEPS.map((s, i) => (
            <option key={s.label} value={i}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
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
