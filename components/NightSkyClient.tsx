"use client";

import dynamic from "next/dynamic";

/**
 * Loads <NightSky> on the client only. The page defaults to "now" on the
 * visitor's clock and time zone, so there is nothing useful to pre-render on
 * the server, and skipping SSR avoids a server/client mismatch.
 */
export const NightSkyClient = dynamic(() => import("@/components/NightSky").then((m) => m.NightSky), {
  ssr: false,
  loading: () => (
    <main className="stage">
      <div className="stage-chart stage-placeholder" aria-hidden="true">
        <svg viewBox="-110 -110 220 220">
          <circle r="100" />
          <circle r="66.7" strokeDasharray="2 3" />
          <circle r="33.3" strokeDasharray="2 3" />
        </svg>
      </div>
    </main>
  ),
});
