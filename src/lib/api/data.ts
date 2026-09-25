/**
 * Data-domain API. Every route is authenticated (Bearer access token, added by
 * the client). Request shapes follow the Postman collection; response shapes are
 * read defensively by callers since the backend wraps payloads as { data }.
 */
import z from "zod";
import { apiFetch } from "./client";
import { preferencesSchema } from "./schema";

/* ---------- User & preferences ---------- */

export interface ApiUser {
  id: string;
  username: string;
  email: string;
  name: string;
  gender?: string;
  birthdate?: string;
  lastStreakDate?: string;
  currentStreak: number;
  longestStreak: number;
  totalDaysCompleted: number;
  createdAt: string;
  updatedAt:string;
}

export function getUser() {
  return apiFetch<ApiUser>("/data/user");
}

/** PUT /data/user — only these three attributes are accepted; returns a message. */
export function updateUser(input: {
  name?: string;
  gender?: "male" | "female" | "other";
  birthdate?: string;
}) {
  return apiFetch<{ message?: string }>("/data/user", {
    method: "PUT",
    body: input,
  });
}

export type Preferences = z.infer<typeof preferencesSchema>

/** Null-ish when the user has never completed onboarding. */
export function getPreferences() {
  return apiFetch<Preferences | null>("/data/preferences");
}

export function updatePreferences(input: Preferences) {
  return apiFetch<Preferences>("/data/preferences", {
    method: "PUT",
    body: input,
  });
}

/* ---------- Medical (safety inputs) ---------- */

export type MedicalType = "allergy" | "condition" | "medication";
export type Severity = "low" | "medium" | "high";

export interface MedicalItem {
  id?: string;
  name: string;
  type: MedicalType;
  severity?: Severity;
  duration?: string;
  medications?: string[];
  notes?: string;
  [key: string]: unknown;
}

export function getMedical() {
  return apiFetch<MedicalItem[]>("/data/medical");
}

export function addMedical(item: MedicalItem) {
  return apiFetch<MedicalItem>("/data/medical", { method: "POST", body: item });
}

export function updateMedical(id: string, patch: Partial<MedicalItem>) {
  return apiFetch<MedicalItem>(`/data/medical/${id}`, {
    method: "PUT",
    body: patch,
  });
}

export function deleteMedical(id: string) {
  return apiFetch<unknown>(`/data/medical/${id}`, { method: "DELETE" });
}

/* ---------- Plans (single-day) ---------- */

export interface MealNutrition {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  [key: string]: unknown;
}

export interface Quantity {
  value: number;
  unit: string;
}

export interface TaskLog {
  is_logged?: boolean;
  status?: "pending" | "logged" | "skipped";
  intake_event_id?: string;
  logged_at?: string;
  rating?: number;
  skip_reason?: string;
}

export interface PlanMeal {
  refId?: string;
  slot?: string; // "Breakfast" | "Lunch" | ...
  time?: string; // "08:00"
  servings?: number;
  name?: string | null;
  description?: string | null;
  nutrition?: MealNutrition;
  ingredients?: string[];
  log?: TaskLog;
}

export interface PlanActivity {
  refId?: string;
  slot?: string;
  time?: string;
  duration?: number; // minutes
  name?: string | null;
  description?: string | null;
  type?: string | null;
  log?: TaskLog;
}

export interface TodayPlan {
  planId?: string;
  date?: string;
  version?: number;
  status?: string;
  targets?: {
    nutrition?: {
      target?: MealNutrition;
      consumed?: MealNutrition;
      remaining?: MealNutrition;
    } | null;
    activity?: {
      target?: Quantity;
      consumed?: Quantity;
    } | null;
  } | null;
  meals?: PlanMeal[];
  activities?: PlanActivity[];
  [key: string]: unknown;
}

export type PlanTodayResult =
  | { state: "ready"; plan: TodayPlan }
  | { state: "generating"; status: "queued" | "processing"; date?: string };

/**
 * GET /data/plans/today — hydrated day view.
 *
 * Reading today with no plan is what *queues* generation (there is no separate
 * "create" route): the response is then 202 with only `{ status, date, message }`,
 * so the status code — not the body — is what distinguishes a real plan from a
 * placeholder. Throws on 404 (a past/future date that was never generated) and
 * on 422 (preferences not set yet).
 */
export async function getPlanToday(date?: string): Promise<PlanTodayResult> {
  const meta: { status?: number } = {};
  const body = await apiFetch<TodayPlan & { status?: string }>(
    `/data/plans/today${date ? `?date=${date}` : ""}`,
    { meta },
  );
  if (meta.status === 202) {
    return {
      state: "generating",
      status: body?.status === "processing" ? "processing" : "queued",
      date: body?.date,
    };
  }
  return { state: "ready", plan: body };
}

export interface PlanStatus {
  planId?: string | null;
  status?: "queued" | "processing" | "completed" | "failed" | null;
  version?: number | null;
  date?: string | null;
  [key: string]: unknown;
}

export function getPlanStatus() {
  return apiFetch<PlanStatus>("/data/plan/status");
}

export function regenPlan() {
  return apiFetch<unknown>("/data/plan/regen", { method: "POST", body: {} });
}

export function resolveDay(date: string, reason = "manual-resolve") {
  return apiFetch<unknown>(`/data/plan/day/${date}/resolve`, {
    method: "POST",
    body: { reason },
  });
}

/** GET /data/plan/history — generation / adaptation audit trail. */
export function getPlanHistory(filter?: { date?: string; causeRef?: string }) {
  const q = new URLSearchParams(
    Object.entries(filter ?? {}).filter(([, v]) => v) as [string, string][],
  ).toString();
  return apiFetch<Record<string, unknown>[]>(
    `/data/plan/history${q ? `?${q}` : ""}`,
  );
}

/* ---------- Catalog ---------- */

export interface CatalogIngredient {
  ingredientId?: string;
  name?: string;
  qty?: number;
  unit?: string;
}

export interface CatalogItem {
  itemId: string;
  type: "meal" | "activity";
  name: string;
  description?: string;
  allergens?: string[];
  ingredients?: CatalogIngredient[];
  nutrients?: MealNutrition;
  attributes?: Record<string, string>;
  conditionFlags?: Record<string, boolean>;
  prepMinutes?: number;
  difficulty?: "easy" | "medium" | "hard";
  equipment?: string[];
  tags?: string[];
  source?: "generated" | "curated";
  createdAt?: string;
  [key: string]: unknown;
}

/** GET /data/catalog/{id} — the recipe/activity behind a plan slot's `refId`. */
export function getCatalogItem(id: string) {
  return apiFetch<CatalogItem>(`/data/catalog/${encodeURIComponent(id)}`);
}

/* ---------- Intake & ledger (Stage G) ---------- */

export interface DurationValue {
  value: number;
  unit: "sec" | "min" | "hour" | "day" | "month" | "year";
}

export type MealType = "breakfast" | "lunch" | "snack" | "dinner";

/** `data` is discriminated by `type` (see openapi.yaml IntakeLogRequest). */
export interface IntakeEvent {
  eventId: string;
  type: "meal" | "activity" | "wellness";
  rating?: number;
  date?: string; // defaults to today
  skipReason?: string;
  data:
    | { refTaskId: string; quantity?: Quantity; duration?: DurationValue }
    | { mealType: MealType; name: string; ingredients?: string[]; quantity?: Quantity }
    | { name: string; difficulty: "easy" | "medium" | "hard"; duration?: DurationValue }
    | { metric: WellnessMetric; value: number; unit?: string; note?: string };
}

/**
 * `weight` is NOT in the spec's wellness enum (sleep|water|mood|energy|issue) —
 * it is sent by /log/weight because no weight endpoint exists anywhere in the
 * API. The backend will reject it with 422 until the enum is widened.
 * ponytail: drop this member once a real weight route lands.
 */
export type WellnessMetric =
  | "sleep"
  | "water"
  | "mood"
  | "energy"
  | "issue"
  | "weight";

/** Idempotent on eventId — generate one per logged event. */
export function logIntake(event: IntakeEvent) {
  return apiFetch<unknown>("/data/intake", { method: "POST", body: event });
}

/** Meal slot for the current hour — for manual entries without a plan ref. */
export function mealTypeNow(): MealType {
  const h = new Date().getHours();
  return h < 11 ? "breakfast" : h < 15 ? "lunch" : h < 18 ? "snack" : "dinner";
}

/** Convenience: random UUID for the eventId (idempotency key). */
export function newEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `evt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export interface Ledger {
  date?: string;
  nutrition?: { target?: MealNutrition; consumed?: MealNutrition };
  /**
   * Flat placeholder shape: `/data/ledger/today` returns `{ targets, consumed,
   * remaining, activityBurnMinutes }` instead of `nutrition.*` when no ledger
   * row exists for the day yet. Readers must accept both.
   */
  targets?: MealNutrition;
  consumed?: MealNutrition;
  remaining?: MealNutrition;
  activityBurnMinutes?: number;
  activity?: { target?: DurationValue; consumed?: DurationValue };
  wellness?: {
    water?: { target?: Quantity; consumed?: Quantity };
    sleep?: { target?: DurationValue; consumed?: DurationValue };
    steps?: { target?: number; consumed?: number };
  };
  [key: string]: unknown;
}

export function getLedgerToday(date?: string) {
  return apiFetch<Ledger>(`/data/ledger/today${date ? `?date=${date}` : ""}`);
}

export interface LedgerWindow {
  windowDays?: number;
  gaps?: Record<string, unknown>;
  balance?: MealNutrition;
  redistribution?: Record<string, unknown>;
  days?: (Ledger & { remaining?: MealNutrition })[];
  [key: string]: unknown;
}

export function getLedgerWindow(days?: number) {
  return apiFetch<LedgerWindow>(
    `/data/ledger/window${days ? `?days=${days}` : ""}`,
  );
}

/* ---------- Pantry & shopping (Stage H) ---------- */

export interface PantryItem {
  ingredientId?: string;
  name: string;
  qty?: number;
  unit?: string;
  boughtAt?: string;
  expiresAt?: string;
  [key: string]: unknown;
}

export interface Pantry {
  id?: string;
  items?: PantryItem[];
  [key: string]: unknown;
}

export function getPantry() {
  return apiFetch<Pantry>("/data/pantry");
}

export function confirmPantry(items: PantryItem[]) {
  return apiFetch<Pantry>("/data/pantry/confirm", {
    method: "POST",
    body: { items },
  });
}

export interface ShoppingItem {
  ingredientId?: string;
  name: string;
  qty?: number;
  unit?: string;
  [key: string]: unknown;
}

export interface ShoppingList {
  date?: string;
  shoppingList?: ShoppingItem[];
  needed?: ShoppingItem[];
}

export function getShoppingList(date?: string) {
  return apiFetch<ShoppingList>(
    `/data/shopping-list${date ? `?date=${date}` : ""}`,
  );
}

/* ---------- Chat history ---------- */

/** Same envelope the coach WebSocket streams — see use-coach-socket.ts. */
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: { message: string; suggestions?: string[] };
  timestamp?: string;
}

export interface Chat {
  id?: string;
  userId?: string;
  messages?: ChatMessage[];
  context?: {
    currentPlanId?: string;
    lastInteraction?: string;
    [key: string]: unknown;
  };
  createdAt?: string;
  updatedAt?: string;
}

/**
 * GET /chats — sessions newest first. Deployed API only; the local Express
 * bridge does not mount it. No `limit` param: the spec notes it is validated as
 * a number against a raw string query and so always 422s. Server default is 50.
 */
export function getChatHistory() {
  return apiFetch<Chat[]>("/chats");
}
