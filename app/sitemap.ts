import type { MetadataRoute } from "next";
import { STARS } from "@/lib/catalog/stars";
import { CONCEPTS, STAR_CONCEPTS } from "@/lib/learn/concepts";
import { placementSlug } from "@/lib/learn/compose";
import { PLANET_ORDER } from "@/lib/learn/planets";
import { SIGN_ORDER } from "@/lib/learn/signs";
import { SITE_URL } from "@/lib/config/site";

export const dynamic = "force-static";

/** Every static route. Generated at build time from the same data the pages use. */
export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => `${SITE_URL}${path}`;
  const learn = [
    "/learn",
    "/learn/stars",
    ...[...CONCEPTS, ...STAR_CONCEPTS].map((c) => `/learn/concepts/${c.slug}`),
    ...PLANET_ORDER.map((p) => `/learn/planets/${p}`),
    ...SIGN_ORDER.map((s) => `/learn/signs/${s.toLowerCase()}`),
    ...PLANET_ORDER.flatMap((p) => SIGN_ORDER.map((s) => `/learn/placements/${placementSlug(p, s)}`)),
    ...STARS.map((s) => `/learn/stars/${s.id}`),
  ];
  return [
    { url: url("/"), priority: 1 },
    ...learn.map((path) => ({ url: url(path), priority: path.split("/").length > 3 ? 0.5 : 0.8 })),
  ];
}
