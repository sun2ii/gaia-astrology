"use client";

import { useEffect, useMemo, useState } from "react";
import { AstrologyPanel } from "@/components/AstrologyPanel";
import { BirthChartPanel, birthDataFromForm, emptyBirthForm, loadBirthForm, type BirthForm } from "@/components/BirthChartPanel";
import { UpcomingPanel } from "@/components/UpcomingPanel";
import { computeZodiacSky } from "@/lib/astrology/zodiacSky";
import { getNatalChart } from "@/lib/astrology/natal";
import { BodyDetail } from "@/components/BodyDetail";
import { ConstellationDetail } from "@/components/ConstellationDetail";
import { ObserverControls, type ObserverSettings } from "@/components/ObserverControls";
import { DEFAULT_LAYERS, SkyChart, type ChartLayers, type ChartSelection } from "@/components/SkyChart";
import { StarDetail } from "@/components/StarDetail";
import { StarList } from "@/components/StarList";
import { Toolbar } from "@/components/Toolbar";
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
import { IDENTITY, type Mat3 } from "@/lib/chart/view";
import { type SpaceAnchor, type ViewMode, bandOffset, followsTime, lockedToBand, spaceAnchor, viewFor, withBandOffset } from "@/lib/chart/presets";
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

/** How often the clock advances while playing. 5 fps keeps the chart smooth and halves the render work. */
const PLAY_TICK_MS = 200;

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
  const [view, setView] = useState<Mat3>(IDENTITY); // how the sphere has been turned
  const [viewMode, setViewMode] = useState<ViewMode>("overhead");
  const [anchor, setAnchor] = useState<SpaceAnchor | null>(null); // space view: the stars' fixed orientation
  const [bandTurn, setBandTurn] = useState(0); // locked modes: how far the user has slid along the band (radians)
  const [zodiacLongitude, setZodiacLongitude] = useState<number | undefined>(undefined); // zodiac view: centre of the band
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
  const [playing, setPlaying] = useState(true);
  const [speedIndex, setSpeedIndex] = useState(() => Math.max(0, PLAY_SPEEDS.findIndex((s) => s.factor === 600))); // 10 min per second
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

  // Stable object while the coordinates are unchanged, so memos keyed on it survive clock ticks.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const observer = useMemo(() => parseObserver(settings), [settings.latitude, settings.longitude]);
  const date = new Date(settings.timeMs);
  const minAltitude = settings.minAltitude;
  // Only observer/instant/threshold move the stars; drags, toggles and selection re-render without recomputing.
  const sky = useMemo(
    () => (observer ? computeSky(observer, date, minAltitude) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the primitives behind observer/date
    [settings.latitude, settings.longitude, settings.timeMs, minAltitude],
  );

  // For following modes the view is derived from the sky each tick rather than stored.
  const liveView = useMemo(() => {
    if (!sky || !observer) return view;
    if (lockedToBand(viewMode)) {
      const base = viewFor(viewMode, { observer, frame: sky.frame, bodies: sky.bodies, zodiacLongitude });
      return base ? withBandOffset(base, bandTurn) : view;
    }
    if (!followsTime(viewMode)) return view;
    return viewFor(viewMode, { observer, frame: sky.frame, bodies: sky.bodies, anchor: anchor ?? undefined }) ?? view;
  }, [sky, observer, viewMode, anchor, view, bandTurn, zodiacLongitude]);
  // Named viewpoints. Static ones set the view once; following ones re-run every tick.
  const chooseView = (mode: ViewMode) => {
    setViewMode(mode);
    setBandTurn(0);
    if (!sky || !observer) return;
    // Zodiac View starts centred on the Sun's place in the zodiac, then stays fixed to the stars;
    // like the equator, dragging only slides along the band.
    if (mode === "zodiac") setZodiacLongitude(sky.bodies.find((b) => b.id === "sun")?.eclipticLongitude);
    if (mode === "space") {
      const a = spaceAnchor(liveView, sky.frame);
      setAnchor(a);
      return;
    }
    const v = viewFor(mode, { observer, frame: sky.frame, bodies: sky.bodies });
    if (v) setView(v);
  };
  // Dragging takes over. In space view the drag re-anchors the stars; otherwise the mode becomes free.
  const onViewDragged = (v: Mat3) => {
    if (lockedToBand(viewMode) && sky && observer) {
      // Only the slide along the band is kept; the band itself stays put.
      const base = viewFor(viewMode, { observer, frame: sky.frame, bodies: sky.bodies, zodiacLongitude });
      if (base) setBandTurn(bandOffset(base, v));
      return;
    }
    setView(v);
    if (viewMode === "space" && sky) setAnchor(spaceAnchor(v, sky.frame));
    else if (viewMode !== "free") setViewMode("free");
  };

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
        </p>
        {playing ? <p className="when-live">Running at {PLAY_SPEEDS[speedIndex].label}</p> : null}
        {!observer ? <p className="error">Latitude must be −90…90 and longitude −180…180.</p> : null}
      </header>

      {/* The sky */}
      <main className="stage">
        {sky && observer ? (
          <div className="stage-chart">
            <SkyChart
              positions={sky.positions}
              constellations={CONSTELLATIONS_WITH_FIGURES}
              colors={CONSTELLATION_COLORS}
              bodies={sky.bodies}
              layers={layers}
              observer={observer}
              zodiacSky={sky.zodiacSky}
              selection={selection}
              view={liveView}
              onView={onViewDragged}
              lockToBand={lockedToBand(viewMode)}
              zodiacOnly={viewMode === "zodiac"}
              onSelectStar={selectStar}
              onSelectConstellation={selectConstellation}
              onSelectBody={selectBody}
            />
          </div>
        ) : null}
      </main>

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

      <a className="credit" href="https://binary1702.com" target="_blank" rel="noreferrer">
        Built by <strong>Binary 1702</strong>
      </a>

      <Toolbar
        layers={layers}
        onToggleLayer={toggleLayer}
        drawer={drawer}
        onToggleDrawer={toggleDrawer}
        playing={playing}
        onTogglePlay={() => setPlaying((p) => !p)}
        speedIndex={speedIndex}
        onSpeedChange={setSpeedIndex}
        onStep={(deltaMs) => setSettings((prev) => ({ ...prev, timeMs: prev.timeMs + deltaMs }))}
        view={liveView}
        viewMode={viewMode}
        homeLabel={DEFAULT_OBSERVER_LABEL}
        onViewMode={chooseView}
        onResetToNow={() => {
          setPlaying(false);
          setSettings((prev) => ({ ...prev, timeMs: Date.now() }));
        }}
      />
    </div>
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
