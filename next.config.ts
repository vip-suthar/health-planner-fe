import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export so Capacitor can bundle the app as native web assets.
  output: "export",
  images: { unoptimized: true },
  // Trailing slash keeps relative asset paths working inside the native shell.
  trailingSlash: true,
  allowedDevOrigins: ['192.168.1.8']
};

export default nextConfig;
