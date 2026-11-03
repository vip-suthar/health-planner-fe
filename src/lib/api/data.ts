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
  readiness?: { ready: boolean; missing: string[] };
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

/** Typeahead row — only what a dropdown shows. Fetch the full item on select. */
export interface CatalogSuggestion {
  itemId: string;
  name: string;
  type: "meal" | "activity";
  calories?: number;
  difficulty?: "easy" | "medium" | "hard";
}

export interface CatalogSearchResult {
  /** The `q` these results answer. */
  query: string;
  items: CatalogSuggestion[];
}

/** Server ignores queries under this length (after trim). */
export const CATALOG_SEARCH_MIN = 2;
/** Server 422s above this length. */
export const CATALOG_SEARCH_MAX = 64;

/**
 * GET /data/catalog/search — typeahead over catalog names. Short queries
 * resolve empty without a request; long ones are clamped instead of 422ing.
 */
export async function searchCatalog(
  q: string,
  type?: "meal" | "activity",
): Promise<CatalogSearchResult> {
  const query = q.trim().slice(0, CATALOG_SEARCH_MAX);
  if (query.length < CATALOG_SEARCH_MIN) return { query, items: [] };
  const params = new URLSearchParams({ q: query });
  if (type) params.set("type", type);
  const res = await apiFetch<Partial<CatalogSearchResult> | null>(
    `/data/catalog/search?${params}`,
  );
  return { query: res?.query ?? query, items: res?.items ?? [] };
}

/* ---------- Intake & ledger (Stage G) ---------- */

export interface DurationValue {
  value: number;
  unit: "sec" | "min" | "hour" | "day" | "month" | "year";
}

export type MealType = "breakfast" | "lunch" | "snack" | "dinner";

/** Mirrors the backend intake request schema. */
interface IntakeCommon {
  eventId: string; // idempotency key
  date?: string; // YYYY-MM-DD; default: today (server time)
  rating?: number; // integer 1–5
  review?: string; // free text — the skip reason on a skip
}

export type IntakeQuantityUnit =
  | "g" | "kg" | "ml" | "l" | "lb" | "inch" | "cm" | "m" | "feet"
  | "spoon" | "bowl" | "glass" | "jug";

/** `value` is a servings multiplier; 0 or missing → 1. */
export interface IntakeQuantity {
  value: number;
  unit: IntakeQuantityUnit;
}

type IntakePlanMeal = IntakeCommon & {
  type: "meal";
  isCustom: false;
  refTaskId: string; // "meal-<refId>", must exist in the plan for `date`
  isSkipped?: boolean; // default false
  quantity?: IntakeQuantity;
};

type IntakeCustomMeal = IntakeCommon & {
  type: "meal";
  isCustom: true;
  quantity?: IntakeQuantity;
  data: {
    mealType: MealType;
    name: string;
    description?: string; // free text when not picked from the catalog
    refTaskId?: string; // picked catalog itemId, else the plan task this replaces
  };
};

type IntakePlanActivity = IntakeCommon & {
  type: "activity";
  isCustom: false;
  refTaskId: string; // "activity-<refId>"
  isSkipped?: boolean; // default false
  duration?: DurationValue; // missing → planned duration
};

type IntakeCustomActivity = IntakeCommon & {
  type: "activity";
  isCustom: true;
  duration?: DurationValue;
  data: {
    name: string;
    description?: string; // free text when not picked from the catalog
    difficulty: "easy" | "medium" | "hard";
    refTaskId?: string; // picked catalog itemId, else the plan task this replaces
  };
};

type IntakeWellness = IntakeCommon & {
  type: "wellness";
  data: { metric: WellnessMetric; value: number; unit?: string; note?: string };
};

/** POST /data/intake body. */
export type IntakeEvent = IntakePlanMeal | IntakeCustomMeal | IntakePlanActivity | IntakeCustomActivity | IntakeWellness;

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

/* ---------- Progress ---------- */

export type NutrientTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};

/** `null` means not logged — never zero. */
export type ProgressMetric = { value: number; target: number | null } | null;

export interface Progress {
  range: { from: string; to: string; days: number };
  goal: {
    type: "lose" | "maintain" | "muscle" | "healthier" | "custom" | null;
    pace: "gentle" | "steady" | "ambitious" | null;
    startedAt: string | null;
    startWeight: number | null;
    currentWeight: number | null; // smoothed trend, kg
    targetWeight: number | null;
    changeKg: number | null; // current - start
    remainingKg: number | null; // target - current
    weeklyRateKg: number | null;
    weeklyRatePercent: number | null;
    etaDate: string | null; // YYYY-MM-DD
    weighIns: number;
    ready: boolean; // enough weigh-ins for rate/ETA
  };
  consistency: { daysLogged: number; days: number; currentStreak: number; longestStreak: number };
  adherence: Record<
    "meals" | "activities",
    { planned: number; logged: number; skipped: number; rate: number | null }
  >;
  nutrition: { daysLogged: number; average: NutrientTotals | null; target: NutrientTotals | null };
  activity: {
    daysLogged: number;
    totalMinutes: number;
    weeklyMinutes: number;
    weeklyTargetMinutes: number | null;
  };
  sleep: { nightsLogged: number; averageHours: number | null; nightsOnTarget: number };
  water: { daysLogged: number; averageMl: number | null; daysOnTarget: number };
  mood: { entries: number; average: number | null }; // 1–5
  energy: { entries: number; average: number | null }; // 1–5
  daily: {
    date: string;
    logged: boolean;
    nutrition: { consumed: NutrientTotals; target: NutrientTotals | null } | null;
    activityMinutes: ProgressMetric;
    sleepHours: ProgressMetric;
    waterMl: ProgressMetric;
    mood: number | null;
    energy: number | null;
    weight: number | null; // raw weigh-in
    weightTrend: number | null; // smoothed, weigh-in days only
  }[];
}

/** GET /data/progress — `days` 7–90, range ends today (server time). */
export function getProgress(days = 30) {
  return apiFetch<Progress>(`/data/progress?days=${days}`);
}

/* ---------- Kitchen & shopping ---------- */

export type StockLevel = "plenty" | "some" | "low" | "out";
export type Storage = "fridge" | "freezer" | "pantry";
export type StapleStatus = "ok" | "low" | "out";

/** Has either `qty` (+ optional `unit`) or `level`, never both. */
export interface KitchenItem {
  id: string;
  ingredientId: string;
  name: string;
  category: string;
  tier?: string;
  storage: Storage;
  qty?: number;
  unit?: string;
  level?: StockLevel;
  dateType?: "use_by" | "best_before" | null;
  expiresOn?: string | null; // YYYY-MM-DD
  addedAt?: string;
  freshness: "fresh" | "use_soon" | "expired";
  daysLeft: number | null;
}

export interface Staple {
  ingredientId: string;
  name: string;
  status: StapleStatus;
}

/** Every kitchen write returns this full view — replace local state with it. */
export interface Kitchen {
  items: KitchenItem[];
  staples: Staple[];
  updatedAt?: string;
}

export interface KitchenItemInput {
  name: string;
  qty?: number;
  unit?: string;
  level?: StockLevel;
  storage?: Storage;
  expiresOn?: string;
}

export function getKitchen() {
  return apiFetch<Kitchen>("/data/kitchen");
}

/** Names matching a staple reset that staple to `ok` instead of adding an item. */
export function addKitchenItems(items: KitchenItemInput[]) {
  return apiFetch<Kitchen>("/data/kitchen/items", {
    method: "POST",
    body: { items },
  });
}

/** Sending `qty` clears `level`; sending `level` clears `qty`/`unit`. */
export function updateKitchenItem(
  id: string,
  patch: Partial<Omit<KitchenItemInput, "name">>,
) {
  return apiFetch<Kitchen>(`/data/kitchen/items/${id}`, {
    method: "PUT",
    body: patch,
  });
}

export function deleteKitchenItem(id: string) {
  return apiFetch<Kitchen>(`/data/kitchen/items/${id}`, { method: "DELETE" });
}

/** Full replace — always send every staple. */
export function updateStaples(staples: { name: string; status: StapleStatus }[]) {
  return apiFetch<Kitchen>("/data/kitchen/staples", {
    method: "PUT",
    body: { staples },
  });
}

export interface ShoppingLine {
  ingredientId: string;
  name: string;
  category: string;
  qty?: number;
  unit?: string;
  /** Empty → a staple marked low/out. */
  for: { date: string; slot: string; meal: string }[];
}

export interface KitchenShoppingList {
  days: number;
  plannedDays: number;
  shoppingList: ShoppingLine[];
}

/** GET /data/kitchen/shopping-list — `days` 1–7, server default 3. */
export function getKitchenShoppingList(days = 3) {
  return apiFetch<KitchenShoppingList>(`/data/kitchen/shopping-list?days=${days}`);
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
