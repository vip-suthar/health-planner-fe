"use client";

import { SWRConfig } from "swr";

/**
 * Global SWR defaults. Fetchers are passed per-hook (each call closes over its
 * typed `dataApi.*` call), so no global fetcher here — just shared behaviour.
 *
 * - revalidateOnFocus off: in the Capacitor WebView every app resume fires a
 *   focus event; we don't want a refetch storm on every foreground.
 * - dedupingInterval widened so shared keys (e.g. /data/plan/current used by
 *   Today + Plan) collapse into one request across mounts.
 */
export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        dedupingInterval: 5000,
        errorRetryCount: 2,
      }}
    >
      {children}
    </SWRConfig>
  );
}
