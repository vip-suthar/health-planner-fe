"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Cognito token store. Owns the persisted tokens (localStorage, available in the
 * Capacitor WebView) plus the derived auth status and the ephemeral scratch state
 * the identifier-first auth screens pass between each other.
 *
 * State lives here; the non-React API client reaches it via the plain helper
 * functions below (`getBearerToken`, `setTokens`, …) which proxy the store.
 */

type Status = "loading" | "authenticated" | "unauthenticated";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  idToken?: string;
}

interface AuthState {
  /** Persisted Cognito tokens, or null when signed out. */
  tokens: AuthTokens | null;
  /** True once the persisted tokens have been read on the client. */
  hydrated: boolean;
  /** Derived from `tokens`/`hydrated`; "loading" until hydration completes. */
  status: Status;
  isAuthenticated: boolean;

  /** Email carried across the identifier-first auth screens. */
  pendingEmail: string | null;
  setPendingEmail: (email: string | null) => void;
  /** Opaque Cognito challenge session (from /start or /initiate). */
  pendingSession: string | null;
  setPendingSession: (session: string | null) => void;
  /** Factors offered for "more ways to sign in" (e.g. PASSWORD, WEB_AUTHN). */
  pendingChallenges: string[] | null;
  setPendingChallenges: (challenges: string[] | null) => void;
  /** Reset code carried from the reset-code screen to the new-password screen. */
  pendingCode: string | null;
  setPendingCode: (code: string | null) => void;

  setTokens: (tokens: AuthTokens) => void;
  clearTokens: () => void;
  /** Flip `hydrated` and re-derive status once persisted tokens are loaded. */
  markHydrated: () => void;
  /** Recompute status from the current tokens (after a cross-tab rehydrate). */
  markAuthenticated: () => void;
  signOut: () => Promise<void>;
}

const hasTokens = (t: AuthTokens | null): boolean =>
  !!(t && (t.idToken || t.accessToken || t.refreshToken));

/** Status/isAuthenticated derived from the raw tokens + hydration flag. */
const derive = (tokens: AuthTokens | null, hydrated: boolean) => ({
  status: (!hydrated
    ? "loading"
    : hasTokens(tokens)
      ? "authenticated"
      : "unauthenticated") as Status,
  isAuthenticated: hydrated && hasTokens(tokens),
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      tokens: null,
      hydrated: false,
      status: "loading",
      isAuthenticated: false,

      pendingEmail: null,
      setPendingEmail: (pendingEmail) => set({ pendingEmail }),
      pendingSession: null,
      setPendingSession: (pendingSession) => set({ pendingSession }),
      pendingChallenges: null,
      setPendingChallenges: (pendingChallenges) => set({ pendingChallenges }),
      pendingCode: null,
      setPendingCode: (pendingCode) => set({ pendingCode }),

      setTokens: (tokens) => set({ tokens, ...derive(tokens, get().hydrated) }),
      clearTokens: () => set({ tokens: null, ...derive(null, get().hydrated) }),
      markHydrated: () =>
        set((s) => ({ hydrated: true, ...derive(s.tokens, true) })),
      markAuthenticated: () => set((s) => derive(s.tokens, s.hydrated)),
      signOut: async () => {
        // Dynamic import breaks the auth-context ↔ api cycle (api reads tokens
        // from here). logout() revokes the refresh chain and clears tokens.
        const { auth } = await import("@/lib/api");
        await auth.logout();
      },
    }),
    {
      name: "np.auth.tokens",
      storage: createJSONStorage(() => localStorage),
      // Only the tokens are durable; status is derived and pending* is scratch.
      partialize: (s) => ({ tokens: s.tokens }),
      // Defer reading storage to the client (avoids an SSR/prerender hydration
      // mismatch); AuthProvider drives it after mount.
      skipHydration: true,
    },
  ),
);

// ── Non-React accessors ─────────────────────────────────────────────────────
// The API client and JWT helpers run outside React; they read/write the store
// through these functions so there is a single source of truth.

/**
 * Resolves once persisted tokens are loaded. Authed requests await this so a
 * fetch fired on mount (before AuthProvider's effect) doesn't go out tokenless.
 */
export const authHydrated = new Promise<void>((resolve) => {
  if (useAuthStore.getState().hydrated) return resolve();
  const unsub = useAuthStore.subscribe((s) => {
    if (s.hydrated) {
      unsub();
      resolve();
    }
  });
});

export function getTokens(): AuthTokens | null {
  return useAuthStore.getState().tokens;
}

export function setTokens(tokens: AuthTokens): void {
  useAuthStore.getState().setTokens(tokens);
}

export function clearTokens(): void {
  useAuthStore.getState().clearTokens();
}

export function getAccessToken(): string | null {
  return getTokens()?.accessToken ?? null;
}

/** Token sent as the Bearer on data routes. */
export function getBearerToken(): string | null {
  const t = getTokens();
  if (!t) return null;
  return t.idToken || t.accessToken || null;
}

/**
 * A session exists if we hold a bearer token or a refresh token we can still
 * exchange. An expired access token with a valid refresh token is still live.
 */
export function hasSession(): boolean {
  return hasTokens(getTokens());
}

/** Decode a JWT `exp` (seconds). Returns null if not a decodable JWT. */
export function getJwtExp(token: string | null | undefined): number | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const json =
      typeof atob === "function"
        ? atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
        : Buffer.from(parts[1], "base64").toString("binary");
    const payload = JSON.parse(json) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

/** True when the token is expired (or within `skewSec` of expiring). */
export function isTokenExpired(token: string | null | undefined, skewSec = 30): boolean {
  const exp = getJwtExp(token);
  if (exp === null) return false; // unknown shape → let the server decide via 401
  return Date.now() / 1000 >= exp - skewSec;
}

// ── React binding ────────────────────────────────────────────────────────────

/**
 * Hydrates tokens from storage on mount, then keeps other tabs in sync via the
 * native `storage` event. Same-tab mutations need no listener — every writer
 * goes through the store, so React subscribers update automatically.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let active = true;
    const store = useAuthStore;
    // Load persisted tokens first, THEN flip `hydrated` so status never resolves
    // to "unauthenticated" while tokens are still loading.
    Promise.resolve(store.persist.rehydrate()).then(() => {
      if (active) store.getState().markHydrated();
    });

    const onStorage = async (e: StorageEvent) => {
      if (e.key && e.key !== "np.auth.tokens") return;
      await store.persist.rehydrate();
      if (active) store.getState().markAuthenticated();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      active = false;
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return <>{children}</>;
}

export function useAuth(): AuthState {
  return useAuthStore();
}
