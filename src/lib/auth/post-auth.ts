import { data as dataApi } from "@/lib/api";

/**
 * After sign-in, /auth/start doesn't say new-vs-returning. Read the profile:
 * a user without preferences (no goal) is treated as new → cold-start onboarding.
 * Any error falls back to onboarding (safe for a freshly-created account).
 */
export async function routeAfterAuth(): Promise<string> {
  try {
    const prefs = await dataApi.getPreferences();
    // `goal` is an object ({ type, targetWeight?, customGoal? }) — its `type`
    // is what proves onboarding was completed. The endpoint 200s with a
    // null-ish body for a user who never saved preferences.
    return prefs?.goal?.type ? "/" : "/onboarding/preferences";
  } catch {
    return "/onboarding/preferences";
  }
}
