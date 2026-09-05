"use client";

import { DEFAULT_USEFUL_ALTITUDE_DEG } from "@/lib/astronomy/visibility";
import { fromDateAndTimeInputs, toDateInputValue, toTimeInputValue } from "@/lib/time";

export type ObserverSettings = {
  latitude: string;
  longitude: string;
  /** The instant being shown, as a Unix timestamp in ms. Drives everything time-related. */
  timeMs: number;
  minAltitude: number;
};

type Props = {
  settings: ObserverSettings;
  onChange: (next: ObserverSettings) => void;
  timeZoneName: string;
};

export function ObserverControls({ settings, onChange, timeZoneName }: Props) {
  const update = (patch: Partial<ObserverSettings>) => onChange({ ...settings, ...patch });
  const current = new Date(settings.timeMs);
  const dateValue = toDateInputValue(current);
  const timeValue = toTimeInputValue(current);

  const setDateTime = (date: string, time: string) => {
    const parsed = fromDateAndTimeInputs(date, time);
    if (parsed) update({ timeMs: parsed.getTime() });
  };

  return (
    <form className="controls" onSubmit={(e) => e.preventDefault()}>
      <div className="controls-row">
        <label>
          <span>Date</span>
          <input type="date" value={dateValue} onChange={(e) => setDateTime(e.target.value, timeValue)} />
        </label>
        <label>
          <span>Time <small>({timeZoneName})</small></span>
          <input type="time" value={timeValue} onChange={(e) => setDateTime(dateValue, e.target.value)} />
        </label>
        <label>
          <span>Latitude <small>(° north)</small></span>
          <input
            type="number"
            inputMode="decimal"
            step="any"
            min={-90}
            max={90}
            value={settings.latitude}
            onChange={(e) => update({ latitude: e.target.value })}
          />
        </label>
        <label>
          <span>Longitude <small>(° east; California is negative)</small></span>
          <input
            type="number"
            inputMode="decimal"
            step="any"
            min={-180}
            max={180}
            value={settings.longitude}
            onChange={(e) => update({ longitude: e.target.value })}
          />
        </label>
        <label>
          <span>Hide stars below <small>(° altitude)</small></span>
          <select value={settings.minAltitude} onChange={(e) => update({ minAltitude: Number(e.target.value) })}>
            <option value={0}>0° — everything above the horizon</option>
            <option value={DEFAULT_USEFUL_ALTITUDE_DEG}>{DEFAULT_USEFUL_ALTITUDE_DEG}° — skip the horizon murk (default)</option>
            <option value={20}>20°</option>
            <option value={30}>30°</option>
          </select>
        </label>
      </div>
    </form>
  );
}
