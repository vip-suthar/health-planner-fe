import { apiFetch } from "./client";
import { clearTokens, getTokens, setTokens } from "@/lib/auth/auth-context";
import {
  type AuthResult,
  type AuthStep,
  type ChallengeState,
  isAuthResult,
} from "./types";

/** Persist tokens when a step completes sign-in. */
function persistIfSignedIn(step: AuthStep): AuthStep {
  if (isAuthResult(step) && step.tokens?.idToken) setTokens(step.tokens);
  return step;
}

/**
 * POST /auth/start — identifier-first entry. Auto-creates the account if new,
 * emails a login code, and returns an EMAIL_OTP challenge. Same response whether
 * or not the account existed. Call again to resend (apply a client cooldown).
 */
export function start(email: string): Promise<ChallengeState> {
  return apiFetch<ChallengeState>("/auth/start", {
    method: "POST",
    noAuth: true,
    body: { email },
  });
}

/**
 * POST /auth/respond — answer a challenge. Returns AuthResult (signed in) or a
 * further ChallengeState. Disambiguated by presence of `answer`.
 */
export async function respond(input: {
  email: string;
  session: string;
  challenge: "EMAIL_OTP" | "PASSWORD";
  answer?: string;
}): Promise<AuthStep> {
  const step = await apiFetch<AuthStep>("/auth/respond", {
    method: "POST",
    noAuth: true,
    body: input,
  });
  return persistIfSignedIn(step);
}

/**
 * POST /auth/initiate — start an alternate factor (password/passkey). Returns a
 * SELECT_CHALLENGE session + availableChallenges WITHOUT sending a code.
 */
export function initiate(input: {
  email: string;
  preferredFactor?: string;
}): Promise<ChallengeState> {
  return apiFetch<ChallengeState>("/auth/initiate", {
    method: "POST",
    noAuth: true,
    body: input,
  });
}

/** Convenience: full password sign-in (initiate → respond PASSWORD). */
export async function passwordSignIn(input: {
  email: string;
  password: string;
}): Promise<AuthStep> {
  const challenge = await initiate({ email: input.email, preferredFactor: "PASSWORD" });
  return respond({
    email: input.email,
    session: challenge.session,
    challenge: "PASSWORD",
    answer: input.password,
  });
}

/** POST /auth/social — verify a native provider token; links/creates the user. */
export async function social(input: {
  provider: "google" | "apple";
  idToken: string;
  name?: string;
}): Promise<AuthResult & { isNewUser?: boolean }> {
  const result = await apiFetch<AuthResult & { isNewUser?: boolean }>("/auth/social", {
    method: "POST",
    noAuth: true,
    body: input,
  });
  if (result?.tokens?.idToken) setTokens(result.tokens);
  return result;
}

/** POST /auth/recover — emails a distinct password-reset code (always 202). */
export function recover(email: string): Promise<unknown> {
  return apiFetch("/auth/recover", {
    method: "POST",
    noAuth: true,
    body: { email },
  });
}

/** POST /auth/recover/confirm — set a new password with the reset code. */
export function recoverConfirm(input: {
  email: string;
  code: string;
  newPassword: string;
}): Promise<unknown> {
  return apiFetch("/auth/recover/confirm", {
    method: "POST",
    noAuth: true,
    body: input,
  });
}

/** POST /auth/logout — revoke the refresh chain; always clears local tokens. */
export async function logout(): Promise<void> {
  const refreshToken = getTokens()?.refreshToken;
  try {
    if (refreshToken) {
      await apiFetch("/auth/logout", {
        method: "POST",
        noAuth: true,
        body: { refreshToken },
      });
    }
  } catch {
    // Ignore — local tokens are cleared regardless.
  } finally {
    clearTokens();
  }
}
