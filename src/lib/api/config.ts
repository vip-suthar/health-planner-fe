/**
 * API configuration. Base URL is overridable at build time via
 * NEXT_PUBLIC_API_BASE_URL (the only env exposed to the static client bundle).
 *
 * NOTE: the default targets the local Express wrapper (`npm run dev` on :8000).
 * A Capacitor build on a real device cannot reach `localhost` — point this at a
 * LAN IP or tunnel when bundling the native app.
 */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
).replace(/\/+$/, "");
