import { API_BASE_URL } from "./config";
import { ApiError } from "./errors";
import {
  AuthTokens,
  authHydrated,
  clearTokens,
  getBearerToken,
  getTokens,
  isTokenExpired,
  setTokens,
} from "@/lib/auth/auth-context";

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  /** JSON body — serialized automatically. */
  body?: unknown;
  /** Skip the Authorization header (auth endpoints, health). */
  noAuth?: boolean;
  /** Internal: prevents infinite refresh recursion. */
  _retried?: boolean;
  signal?: AbortSignal;
  /**
   * Out-param filled with the HTTP status before the `{ data }` envelope is
   * unwrapped. Needed where the status carries meaning the body doesn't —
   * e.g. `/data/plans/today` returns 202 when generation was only queued.
   */
  meta?: { status?: number };
}

/** Backend wraps successful payloads as `{ data: T }`; some routes return bare. */
interface Envelope<T> {
  data?: T;
}

function buildUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractMessage(payload: unknown, fallback: string): {
  message: string;
  code?: string;
  details?: unknown;
} {
  if (payload && typeof payload === "object") {
    const p = payload as Record<string, unknown>;
    const err = p.error;
    if (err && typeof err === "object") {
      const e = err as Record<string, unknown>;
      let message = (e.message as string) || fallback;
      // VALIDATION_ERROR: details is an array of { message }.
      if (Array.isArray(e.details) && e.details.length) {
        const first = e.details[0] as { message?: string };
        if (first?.message) message = first.message;
      }
      return { message, code: e.code as string | undefined, details: e.details };
    }
    if (typeof p.message === "string") return { message: p.message };
    if (typeof p.error === "string") return { message: p.error };
  }
  return { message: fallback };
}

/**
 * Refresh outcome:
 * - refreshed: new tokens persisted.
 * - invalid:   refresh token rejected (or absent) → session is unrecoverable.
 * - transient: network/5xx hiccup → keep tokens, retry later.
 */
type RefreshResult =
  | { status: "refreshed"; tokens: AuthTokens }
  | { status: "invalid" }
  | { status: "transient" };

/** One in-flight refresh shared across concurrent 401s. */
let refreshInFlight: Promise<RefreshResult> | null = null;

async function refreshTokens(): Promise<RefreshResult> {
  const current = getTokens();
  if (!current?.refreshToken) return { status: "invalid" };

  if (!refreshInFlight) {
    const run = async (): Promise<RefreshResult> => {
      let res: Response;
      try {
        res = await fetch(buildUrl("/auth/token/refresh"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: current.refreshToken }),
        });
      } catch {
        return { status: "transient" }; // network down
      }

      // Refresh token explicitly rejected → unrecoverable session.
      if (res.status === 400 || res.status === 401 || res.status === 403) {
        return { status: "invalid" };
      }
      // Server error → don't destroy the session over a transient failure.
      if (!res.ok) return { status: "transient" };

      const payload = (await parseBody(res)) as Envelope<{ tokens?: AuthTokens }> | null;
      const tokens = payload?.data?.tokens;
      if (!tokens?.accessToken && !tokens?.idToken) {
        return { status: "transient" };
      }
      // Refresh response usually omits the refresh token — keep the existing one.
      const merged: AuthTokens = {
        accessToken: tokens.accessToken ?? current.accessToken,
        refreshToken: tokens.refreshToken || current.refreshToken,
        idToken: tokens.idToken ?? current.idToken,
      };
      setTokens(merged);
      return { status: "refreshed", tokens: merged };
    };
    refreshInFlight = run().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/**
 * Typed fetch wrapper. Adds the Bearer token, serializes JSON, unwraps the
 * `{ data }` envelope, normalizes errors to ApiError, refreshes proactively when
 * the token is expired, and transparently refreshes once on a 401. Tokens are
 * only cleared when the refresh token itself is rejected — a transient failure
 * or a non-auth 401 never logs the user out.
 */
export async function apiFetch<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, noAuth, _retried, signal, meta } = opts;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (!noAuth) {
    await authHydrated;
    // Proactively refresh an expired token to avoid a guaranteed 401 round-trip.
    let bearer = getBearerToken();
    if (!_retried && bearer && isTokenExpired(bearer) && getTokens()?.refreshToken) {
      const r = await refreshTokens();
      if (r.status === "invalid") clearTokens();
      bearer = getBearerToken();
    }
    if (bearer) headers.Authorization = `Bearer ${bearer}`;
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (e) {
    throw new ApiError(
      e instanceof Error ? e.message : "Network request failed",
      0,
      "network_error",
    );
  }

  if (meta) meta.status = res.status;

  if (res.status === 401 && !noAuth && !_retried) {
    const r = await refreshTokens();
    if (r.status === "refreshed") {
      return apiFetch<T>(path, { ...opts, _retried: true });
    }
    // Only end the session if the refresh token was actually rejected.
    if (r.status === "invalid") clearTokens();
    // transient → keep tokens; fall through and surface the 401.
  }

  const payload = await parseBody(res);

  if (!res.ok) {
    const { message, code, details } = extractMessage(
      payload,
      `Request failed (${res.status})`,
    );
    throw new ApiError(message, res.status, code, details);
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as Envelope<T>).data as T;
  }
  return payload as T;
}
