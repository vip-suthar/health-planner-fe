/**
 * Defensive mappers: API payloads → existing view-model shapes used by the
 * screens. Every accessor is optional-chained; callers fall back to mock data
 * when a mapper returns null.
 */
import type {
  Ledger,
  MealNutrition,
  PantryItem as ApiPantryItem,
  ShoppingList,
  TodayPlan,
} from "@/lib/api/data";
import type {
  Budget,
  ItemStatus,
  MacroKey,
  TimelineItem,
} from "@/lib/data";
import type { PantryItem as ViewPantryItem } from "@/lib/data";

const num = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function nutritionMeta(n?: MealNutrition): string | undefined {
  if (!n) return undefined;
  const parts: string[] = [];
  if (num(n.calories) !== undefined)
    parts.push(`${Math.round(n.calories!)} kcal`);
  if (num(n.protein) !== undefined) parts.push(`${Math.round(n.protein!)}P`);
  return parts.length ? parts.join(" · ") : undefined;
}

/* ---------- Time parsing ("06:00 - 06:45 am" / "01:00 - 01:30 pm") ---------- */

function to24h(h: number, m: number, mer: string | null): number {
  // No meridiem → already 24h ("13:00" from the plan API).
  let hour = mer ? h % 12 : h;
  if (mer === "pm") hour += 12;
  return hour * 60 + m;
}

interface TimeRange {
  startMin: number;
  endMin: number;
  display: string; // short start, e.g. "08:00"
}

function parseTimeRange(time?: string): TimeRange | null {
  if (!time) return null;
  const mer = /pm/i.test(time) ? "pm" : /am/i.test(time) ? "am" : null;
  const nums = time.match(/(\d{1,2}):(\d{2})/g);
  if (!nums?.length) return null;
  const parse = (s: string) => {
    const [h, m] = s.split(":").map(Number);
    return to24h(h, m, mer);
  };
  const startMin = parse(nums[0]);
  const endMin = nums[1] ? parse(nums[1]) : startMin;
  return { startMin, endMin, display: nums[0] };
}

function statusFor(range: TimeRange | null, isToday: boolean): ItemStatus {
  // "done" means actually logged (tracked by the caller), never time-passed.
  // A past-but-unlogged item stays loggable ("upcoming").
  if (!isToday || !range) return "upcoming";
  const now = new Date().getHours() * 60 + new Date().getMinutes();
  if (now >= range.startMin && now < range.endMin) return "now";
  return "upcoming";
}

/* ---------- Today: ledger → budget ring + macros ---------- */

export function mapBudget(ledger?: Ledger): Budget | null {
  // Two shapes come back from /data/ledger/today: the stored LedgerDay
  // (`nutrition.target`) and, before any row exists for the day, a flat
  // zeroed placeholder (`targets`). Both must render the ring.
  const t = ledger?.nutrition?.target ?? ledger?.targets;
  const c = ledger?.nutrition?.consumed ?? ledger?.consumed;
  if (!t) return null;

  const kcalGoal = num(t.calories) ?? 0;
  const kcalLeft = kcalGoal - (num(c?.calories) ?? 0);

  const macroDefs: { key: MacroKey; label: string }[] = [
    { key: "protein", label: "Protein" },
    { key: "carbs", label: "Carbs" },
    { key: "fat", label: "Fat" },
  ];
  const macros = macroDefs.map((m) => ({
    key: m.key,
    label: m.label,
    value: num(c?.[m.key]) ?? 0,
    goal: num(t[m.key]) ?? 0,
    unit: "g",
  }));

  const water = ledger?.wellness?.water;
  return {
    kcalLeft,
    kcalGoal,
    macros,
    water: {
      current: num(water?.consumed?.value) ?? 0,
      goal: num(water?.target?.value) ?? 0,
    },
  };
}

/* ---------- Today: plan day → timeline ---------- */

/**
 * Item ids are the plan-task refs (`meal-<refId>` / `activity-<refId>`) so a
 * log call can send them as `refTaskId` directly.
 */
export function mapTimeline(plan: TodayPlan | null): TimelineItem[] | null {
  if (!plan) return null;
  const isToday = !plan.date || plan.date === todayISO();

  const items = [
    ...(plan.meals ?? []).map((m, i) => {
      const range = parseTimeRange(m.time);
      return {
        sort: range?.startMin ?? 0,
        item: {
          id: m.refId ? `meal-${m.refId}` : `meal-${i}`,
          time: range?.display ?? m.time ?? "",
          kind: "meal" as const,
          label: (m.slot ?? "MEAL").toUpperCase(),
          title: m.name ?? "Meal",
          status:
            m.log?.status === "logged"
              ? ("done" as const)
              : statusFor(range, isToday),
          meta: nutritionMeta(m.nutrition),
        },
      };
    }),
    ...(plan.activities ?? []).map((a, i) => {
      const range = parseTimeRange(a.time);
      return {
        sort: range?.startMin ?? 0,
        item: {
          id: a.refId ? `activity-${a.refId}` : `activity-${i}`,
          time: range?.display ?? a.time ?? "",
          kind: "activity" as const,
          label: (a.type ?? a.slot ?? "MOVE").toUpperCase(),
          title: a.name ?? "Activity",
          status:
            a.log?.status === "logged"
              ? ("done" as const)
              : statusFor(range, isToday),
          meta: a.duration ? `${a.duration} min` : undefined,
        },
      };
    }),
  ];
  if (!items.length) return null;
  return items.sort((a, b) => a.sort - b.sort).map((x) => x.item);
}

/* ---------- Kitchen: pantry + shopping ---------- */

export function mapPantry(
  items: ApiPantryItem[] | null,
): ViewPantryItem[] | null {
  if (!items?.length) return null;
  return items.map((it) => {
    const qty = [num(it.qty), it.unit].filter(Boolean).join(" ");
    const expiringSoon =
      it.expiresAt &&
      new Date(it.expiresAt).getTime() - Date.now() < 3 * 86400000;
    return {
      name: it.name,
      qty: qty || "—",
      tag: expiringSoon
        ? { text: "USE SOON", tone: "caution" as const }
        : { text: "FRESH", tone: "brand" as const },
    };
  });
}

export function mapShoppingItems(
  raw: ShoppingList | null,
): { name: string; checked: boolean }[] | null {
  const list = raw?.shoppingList ?? raw?.needed;
  if (!list?.length) return null;
  return list.map((it) => ({
    name: [
      it.name,
      num(it.qty) ? `· ${it.qty}${it.unit ? ` ${it.unit}` : ""}` : "",
    ]
      .filter(Boolean)
      .join(" "),
    checked: false,
  }));
}
