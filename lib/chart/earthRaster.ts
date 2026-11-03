import earthJson from "@/data/earth.json";

/**
 * A land/ocean bitmap in equirectangular projection, rasterised once in the
 * browser from the coastline rings. The planet is then painted per pixel by
 * mapping each screen pixel back to latitude/longitude and looking it up
 * here — which sidesteps every polygon-clipping problem a sphere has.
 */
export const MASK_W = 2048;
export const MASK_H = 1024;

let cached: Uint8Array | null = null;

export function landMask(): Uint8Array | null {
  if (cached) return cached;
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = MASK_W;
  canvas.height = MASK_H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, MASK_W, MASK_H);
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  for (const ring of (earthJson as { rings: number[][][] }).rings) {
    ring.forEach(([lon, lat], i) => {
      const x = ((lon + 180) / 360) * MASK_W;
      const y = ((90 - lat) / 180) * MASK_H;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
  }
  ctx.fill("nonzero");
  const img = ctx.getImageData(0, 0, MASK_W, MASK_H).data;
  const mask = new Uint8Array(MASK_W * MASK_H);
  for (let i = 0; i < mask.length; i++) mask[i] = img[i * 4] > 127 ? 1 : 0;
  cached = mask;
  return mask;
}

/** Land (1) or ocean (0) at a latitude/longitude. */
export function isLand(mask: Uint8Array, latitude: number, longitude: number): number {
  const x = Math.min(MASK_W - 1, Math.max(0, Math.floor(((longitude + 180) / 360) * MASK_W)));
  const y = Math.min(MASK_H - 1, Math.max(0, Math.floor(((90 - latitude) / 180) * MASK_H)));
  return mask[y * MASK_W + x];
}
