import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["lh"],
  // Static export for Capacitor
  output: "export",

  // Disable image optimization (not supported in static export)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
