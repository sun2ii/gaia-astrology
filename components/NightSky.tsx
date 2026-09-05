"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AstrologyPanel } from "@/components/AstrologyPanel";
import { BirthChartPanel, birthDataFromForm, emptyBirthForm, loadBirthForm, type BirthForm } from "@/components/BirthChartPanel";
import { UpcomingPanel } from "@/components/UpcomingPanel";
import { ZodiacStrip } from "@/components/ZodiacStrip";
import { computeZodiacSky } from "@/lib/astrology/zodiacSky";
import { getNatalChart } from "@/lib/astrology/natal";
import { BodyDetail } from "@/components/BodyDetail";
import { ConstellationDetail } from "@/components/ConstellationDetail";
import { ObserverControls, type ObserverSettings } from "@/components/ObserverControls";
import { DEFAULT_LAYERS, SkyChart, type ChartLayers, type ChartSelection } from "@/components/SkyChart";
import { StarDetail } from "@/components/StarDetail";
import { StarList } from "@/components/StarList";
import { TimeControls } from "@/components/TimeControls";
import { createSkyFrame, toHorizontal } from "@/lib/astronomy/coordinates";
import { getSolarSystemPositions, type SolarSystemBodyId } from "@/lib/astronomy/solarSystem";
import type { Observer } from "@/lib/astronomy/types";
import { DEFAULT_USEFUL_ALTITUDE_DEG, getVisibleStars, isAboveHorizon } from "@/lib/astronomy/visibility";
import { astrologyStateFromPositions } from "@/lib/astrology/engine";
import {
  BRIGHT_STARS,
  CONSTELLATIONS_WITH_FIGURES,
  STARS,
  STAR_CATALOG_META,
  getConstellation,
  getStarById,
} from "@/lib/catalog/stars";
import { assignConstellationColors } from "@/lib/chart/constellationColors";
import { DEFAULT_OBSERVER, DEFAULT_OBSERVER_LABEL } from "@/lib/config/observer";
import { PLAY_SPEEDS, formatLongDate, formatTime, localTimeZoneName } from "@/lib/time";

function settingsForNow(observer: Observer, minAltitude: number): ObserverSettings {
  return {
    latitude: String(observer.latitude),
    longitude: String(observer.longitude),
    timeMs: Date.now(),
    minAltitude,
  };
}

function parseObserver(settings: ObserverSettings): Observer | null {
  const latitude = Number(settings.latitude);
  const longitude = Number(settings.longitude);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return null;
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

/** Everything needed to render the sky for one observer + instant. */
function computeSky(observer: Observer, date: Date, minAltitude: number) {
  const frame = createSkyFrame(observer, date);
  const positions = STARS.map((star) => ({ star, horizontal: toHorizontal(star, frame) }));
  const shown = getVisibleStars(BRIGHT_STARS, { ...observer, date, minAltitude });
  const aboveHorizonCount = positions.filter((p) => p.star.tier === "bright" && isAboveHorizon(p.horizontal.altitude)).length;
  const bodies = getSolarSystemPositions(observer, date);
  const astrology = astrologyStateFromPositions(bodies, observer, date);
  const zodiacSky = computeZodiacSky(observer, date);
  return { shown, aboveHorizonCount, frame, positions, bodies, astrology, zodiacSky };
}

/** Computed once: depends only on the catalog. */
const CONSTELLATION_COLORS = assignConstellationColors(CONSTELLATIONS_WITH_FIGURES, STARS);

/** How often the clock advances while playing. 10 fps is smooth enough for a star chart. */
const PLAY_TICK_MS = 100;

/** Which drawer is open on the side. "detail" opens automatically on selection. */
type Drawer = "detail" | "stars" | "astrology" | "birth" | "upcoming" | "observer" | "about" | null;

/**
 * Single-page layout: the chart fills the screen, a toolbar sits at the
 * bottom, and everything else (details, lists, settings) lives in a drawer.
 * Rendered on the client only (see app/page.tsx).
 */
export function NightSky() {
  const [settings, setSettings] = useState<ObserverSettings>(() =>
    settingsForNow(DEFAULT_OBSERVER, DEFAULT_USEFUL_ALTITUDE_DEG),
  );
  const [layers, setLayers] = useState<ChartLayers>(DEFAULT_LAYERS);
  const [selection, setSelection] = useState<ChartSelection>(null);
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [birthForm, setBirthForm] = useState<BirthForm>(() => loadBirthForm() ?? emptyBirthForm(DEFAULT_OBSERVER));
  const timeZoneName = localTimeZoneName();

  const select = (next: ChartSelection) => {
    setSelection(next);
    setDrawer(next ? "detail" : null);
  };
  const selectStar = (id: string) => select({ kind: "star", id });
  const selectConstellation = (abbreviation: string) => select({ kind: "constellation", abbreviation });
  const selectBody = (id: SolarSystemBodyId) => select({ kind: "body", id });
  const toggleDrawer = (which: Drawer) => setDrawer((d) => (d === which ? null : which));
  const toggleLayer = (key: keyof ChartLayers) => setLayers((l) => ({ ...l, [key]: !l[key] }));

  // Time bar state. While playing, the clock advances by speed × real elapsed time.
  const [playing, setPlaying] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(3); // 1 hour per second
  const [stepIndex, setStepIndex] = useState(1); // 1 hour
  useEffect(() => {
    if (!playing) return;
    const factor = PLAY_SPEEDS[speedIndex].factor;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const elapsed = now - last;
      last = now;
      setSettings((prev) => ({ ...prev, timeMs: prev.timeMs + elapsed * factor }));
    }, PLAY_TICK_MS);
    return () => window.clearInterval(id);
  }, [playing, speedIndex]);

  const observer = parseObserver(settings);
  const date = new Date(settings.timeMs);
  const minAltitude = settings.minAltitude;
  const sky = observer ? computeSky(observer, date, minAltitude) : null;

  const selectedStar = selection?.kind === "star" ? getStarById(selection.id) : undefined;
  const selectedHorizontal = selectedStar && sky ? toHorizontal(selectedStar, sky.frame) : null;
  const selectedConstellation = selection?.kind === "constellation" ? getConstellation(selection.abbreviation) : undefined;
  const selectedBody = selection?.kind === "body" && sky ? sky.bodies.find((b) => b.id === selection.id) : undefined;
  const selectedPlacement = selectedBody && sky ? sky.astrology.planets.find((p) => p.body === selectedBody.id) : undefined;

  // Birth chart (if entered) for the upcoming-events scan. Key changes remount the panel and re-scan.
  const birthData = birthDataFromForm(birthForm);
  const natalChart = birthData ? getNatalChart(birthData) : null;
  const upcomingKey = `${new Date(settings.timeMs).toDateString()}|${birthData?.instant.getTime() ?? "none"}|${birthData?.location.latitude ?? ""}`;

  const closeDrawer = () => {
    setDrawer(null);
    setSelection(null);
  };

  return (
    <div className="app">
      {/* Top-left status */}
      <header className="hud">
        <p className="eyebrow">NIGHT SKY</p>
        <h1>{DEFAULT_OBSERVER_LABEL}</h1>
        <p className="when">
          {formatLongDate(date)} · {formatTime(date)}
          {playing ? <span className="when-live"> · running at {PLAY_SPEEDS[speedIndex].label}</span> : null}
        </p>
        {!observer ? <p className="error">Latitude must be −90…90 and longitude −180…180.</p> : null}
      </header>

      {/* The sky */}
      <main className="stage">
        {sky ? (
          <div className="stage-chart">
            <SkyChart
              positions={sky.positions}
              constellations={CONSTELLATIONS_WITH_FIGURES}
              colors={CONSTELLATION_COLORS}
              bodies={sky.bodies}
              layers={layers}
              zodiacSky={sky.zodiacSky}
              selection={selection}
              onSelectStar={selectStar}
              onSelectConstellation={selectConstellation}
              onSelectBody={selectBody}
            />
          </div>
        ) : null}
      </main>

      {/* Zodiac strip (when the zodiac layer is on) */}
      {sky && layers.zodiac ? (
        <ZodiacStrip
          selected={selection?.kind === "constellation" ? selection.abbreviation : selection?.kind === "star" ? getStarById(selection.id)?.constellation ?? null : null}
          upNow={Object.fromEntries(
            CONSTELLATIONS_WITH_FIGURES.map((c) => [
              c.abbreviation,
              c.lines.flat().some((id) => (sky.positions.find((p) => p.star.id === id)?.horizontal.altitude ?? -90) > 0),
            ]),
          )}
          onSelect={selectConstellation}
        />
      ) : null}

      {/* Side drawer */}
      {drawer && sky ? (
        <aside className={`drawer drawer-${drawer}`}>
          {drawer === "detail" && selectedStar && selectedHorizontal ? (
            <StarDetail
              star={selectedStar}
              horizontal={selectedHorizontal}
              constellationColor={CONSTELLATION_COLORS.get(selectedStar.constellation)}
              onSelectConstellation={selectConstellation}
              onClose={closeDrawer}
            />
          ) : drawer === "detail" && selectedBody && selectedPlacement ? (
            <BodyDetail
              body={selectedBody}
              placement={selectedPlacement}
              aspects={sky.astrology.aspects}
              onSelectBody={selectBody}
              onSelectConstellation={selectConstellation}
              onClose={closeDrawer}
            />
          ) : drawer === "detail" && selectedConstellation ? (
            <ConstellationDetail
              constellation={selectedConstellation}
              color={CONSTELLATION_COLORS.get(selectedConstellation.abbreviation)}
              positions={sky.positions}
              onSelectStar={selectStar}
              onClose={closeDrawer}
            />
          ) : drawer === "stars" ? (
            <div className="drawer-panel">
              <DrawerHeader title="Visible bright stars" onClose={() => setDrawer(null)} />
              <p className="count">
                {sky.shown.length} / {BRIGHT_STARS.length}
              </p>
              <p className="count-note">
                {sky.aboveHorizonCount} above the horizon; showing those higher than {minAltitude}°.
              </p>
              <StarList stars={sky.shown} selectedId={selection?.kind === "star" ? selection.id : null} onSelect={selectStar} />
            </div>
          ) : drawer === "astrology" ? (
            <div className="drawer-panel">
              <DrawerHeader title="Today's sky" onClose={() => setDrawer(null)} />
              <AstrologyPanel state={sky.astrology} bodies={sky.bodies} onSelectBody={selectBody} />
            </div>
          ) : drawer === "birth" && observer ? (
            <BirthChartPanel
              form={birthForm}
              onChange={setBirthForm}
              now={sky.astrology}
              currentObserver={observer}
              onClose={() => setDrawer(null)}
            />
          ) : drawer === "upcoming" ? (
            <div className="drawer-panel">
              <DrawerHeader title="Coming up" onClose={() => setDrawer(null)} />
              <UpcomingPanel key={upcomingKey} from={date} natal={natalChart} />
            </div>
          ) : drawer === "observer" ? (
            <div className="drawer-panel">
              <DrawerHeader title="Observer" onClose={() => setDrawer(null)} />
              <ObserverControls settings={settings} onChange={setSettings} timeZoneName={timeZoneName} />
            </div>
          ) : drawer === "about" ? (
            <div className="drawer-panel about">
              <DrawerHeader title="About this chart" onClose={() => setDrawer(null)} />
              <p>
                Hold the chart over your head with <strong>N</strong> pointing north. The centre is straight up, the rim is the
                horizon, and the dashed rings mark 30° and 60° up. East is on the <em>left</em> because you are looking up, not
                down at a map.
              </p>
              <p>
                {BRIGHT_STARS.length} bright stars (Johnson V ≤ {STAR_CATALOG_META.cutoffMagnitude.toFixed(2)}) plus{" "}
                {STARS.length - BRIGHT_STARS.length} fainter stars that complete the constellation figures. Catalog data from
                Hipparcos, the Yale Bright Star Catalogue and the IAU star-name list; figures from Stellarium (CC BY-SA 4.0);
                Sun, Moon and planets from the astronomy-engine ephemeris. See DATA_SOURCES.md.
              </p>
              <p>
                &ldquo;Visible&rdquo; means geometrically above the horizon. Whether you can actually see something also
                depends on light pollution, weather, haze, the Moon, your eyesight and what is blocking your horizon.
              </p>
            </div>
          ) : null}
        </aside>
      ) : null}

      {/* Bottom toolbar */}
      <nav className="toolbar" aria-label="Toolbar">
        <div className="toolbar-group" role="group" aria-label="Layers">
          <Toggle label="Stars" active={layers.stars} onClick={() => toggleLayer("stars")} />
          <Toggle label="Constellations" active={layers.constellations} onClick={() => toggleLayer("constellations")} />
          <Toggle label="Planets" active={layers.planets} onClick={() => toggleLayer("planets")} />
          <Toggle label="Names" active={layers.labels} onClick={() => toggleLayer("labels")} />
          <Toggle label="Zodiac" active={layers.zodiac} onClick={() => toggleLayer("zodiac")} />
        </div>

        <TimeControls
          playing={playing}
          speedIndex={speedIndex}
          stepIndex={stepIndex}
          onStep={(deltaMs) => setSettings((prev) => ({ ...prev, timeMs: prev.timeMs + deltaMs }))}
          onTogglePlay={() => setPlaying((p) => !p)}
          onSpeedChange={setSpeedIndex}
          onStepSizeChange={setStepIndex}
          onResetToNow={() => {
            setPlaying(false);
            setSettings((prev) => ({ ...prev, timeMs: Date.now() }));
          }}
        />

        <div className="toolbar-group" role="group" aria-label="Panels">
          <Toggle label="Star list" active={drawer === "stars"} onClick={() => toggleDrawer("stars")} />
          <Toggle label="Today's sky" active={drawer === "astrology"} onClick={() => toggleDrawer("astrology")} />
          <Toggle label="Birth chart" active={drawer === "birth"} onClick={() => toggleDrawer("birth")} />
          <Toggle label="Coming up" active={drawer === "upcoming"} onClick={() => toggleDrawer("upcoming")} />
          <Toggle label="Observer" active={drawer === "observer"} onClick={() => toggleDrawer("observer")} />
          <Link className="toggle" href="/learn">
            Learn
          </Link>
          <Toggle label="?" active={drawer === "about"} onClick={() => toggleDrawer("about")} />
        </div>
      </nav>
    </div>
  );
}

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`toggle${active ? " active" : ""}`} aria-pressed={active} onClick={onClick}>
      {label}
    </button>
  );
}

function DrawerHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="detail-header">
      <h2>{title.toUpperCase()}</h2>
      <button type="button" onClick={onClose} aria-label="Close">
        ×
      </button>
    </div>
  );
}
