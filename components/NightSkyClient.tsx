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
      <p className="empty">Loading the sky…</p>
    </main>
  ),
});
