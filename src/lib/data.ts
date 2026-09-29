/* Mock domain data for NutriPlan screens. Shape-first; swap for API later. */

export type ItemStatus = "done" | "skipped" | "now" | "upcoming" | "provisional";
export type MealKind = "breakfast" | "lunch" | "dinner" | "snack";
export type MacroKey = "protein" | "carbs" | "fat";

export interface Macro {
  key: MacroKey;
  label: string;
  value: number;
  goal: number;
  unit: string;
}

export interface Budget {
  kcalLeft: number;
  kcalGoal: number;
  macros: Macro[];
  water: { current: number; goal: number };
}

export interface TimelineItem {
  id: string;
  time: string;
  kind: "meal" | "activity";
  label: string; // eyebrow, e.g. BREAKFAST / MOVE / DINNER
  title: string;
  status: ItemStatus;
  meta?: string; // "540 kcal · 32P · 18m"
  fromPantry?: boolean;
  note?: string; // provisional copy
}

export interface ContentCard {
  id: string;
  kind: "article" | "recipe" | "guide" | "community";
  readTime?: string;
  title: string;
  tone: "forecast" | "brand" | "caution";
  /** CMS slug — when present, the card opens the CMS-backed reader. */
  slug?: string;
  /** Optional cover image URL (CMS); falls back to a hatch pattern. */
  coverUrl?: string | null;
}

export interface User {
  name: string;
  streak: number;
  bestStreak: number;
  safe: boolean;
}

export const budget: Budget = {
  kcalLeft: 760,
  kcalGoal: 2000,
  macros: [
    { key: "protein", label: "Protein", value: 82, goal: 120, unit: "g" },
    { key: "carbs", label: "Carbs", value: 120, goal: 210, unit: "g" },
    { key: "fat", label: "Fat", value: 38, goal: 65, unit: "g" },
  ],
  water: { current: 4, goal: 8 },
};

export const coachNudge =
  "Protein's a bit low today — **this lunch** closes the gap.";

export const timeline: TimelineItem[] = [
  {
    id: "t1",
    time: "08:00",
    kind: "meal",
    label: "BREAKFAST",
    title: "Greek yogurt & berries",
    status: "done",
    meta: "320 kcal · 24P",
  },
  {
    id: "t2",
    time: "12:30",
    kind: "meal",
    label: "LUNCH · NOW",
    title: "Lemon chickpea grain bowl",
    status: "now",
    meta: "540 kcal · 32P · 18m",
    fromPantry: true,
  },
  {
    id: "t3",
    time: "18:00",
    kind: "activity",
    label: "MOVE",
    title: "Evening walk · 30 min",
    status: "upcoming",
  },
  {
    id: "t4",
    time: "19:30",
    kind: "meal",
    label: "DINNER",
    title: "Pick at dinner — 3 safe options ready",
    status: "provisional",
    note: "Stays a forecast until you commit.",
  },
];

export const forYou: ContentCard[] = [
  {
    id: "c1",
    kind: "article",
    readTime: "4 MIN",
    title: "Iron-rich plants that actually absorb",
    tone: "forecast",
  },
  {
    id: "c2",
    kind: "recipe",
    readTime: "20 MIN",
    title: "5-ingredient lentil soup",
    tone: "brand",
  },
];

/* ---------- Plan (week) ---------- */
export interface PlanDay {
  weekday: string;
  date: number;
  state: "firm" | "today" | "provisional";
  dotTone: "brand" | "forecast";
}

export const weekDays: PlanDay[] = [
  { weekday: "TUE", date: 22, state: "firm", dotTone: "brand" },
  { weekday: "WED", date: 23, state: "today", dotTone: "brand" },
  { weekday: "THU", date: 24, state: "firm", dotTone: "brand" },
  { weekday: "FRI", date: 25, state: "provisional", dotTone: "forecast" },
  { weekday: "SAT", date: 26, state: "provisional", dotTone: "forecast" },
  { weekday: "SUN", date: 27, state: "provisional", dotTone: "forecast" },
];

export const planChanged = {
  title: "What changed since Sunday",
  body: "Moved 2 workouts to evenings · added spinach (iron ran low) · kept your Thursday salmon.",
};

export interface PlanItem {
  id: string;
  time: string;
  label: string;
  title: string;
  description: string;
  tags: string[];
  meta?: string;
  badge?: { text: string; tone: "brand" | "neutral" };
  logged?: boolean;
  kind: "meal" | "activity";
}

export const planSelectedDay = {
  title: "Wednesday · today",
  kcal: "1,940 kcal planned",
  items: [
    {
      id: "p1",
      time: "08:00",
      label: "BREAKFAST",
      title: "Greek yogurt & berries",
      description: "A protein-rich start that tops up calcium and fiber.",
      tags: ["Greek yogurt", "Blueberries", "Walnuts", "Honey"],
      meta: "320 kcal · 24P",
      logged: true,
      kind: "meal",
    },
    {
      id: "p2",
      time: "12:30",
      label: "LUNCH",
      title: "Lemon chickpea grain bowl",
      description:
        "Bright and filling — built entirely from what's already in your pantry.",
      tags: ["Chickpeas", "Spinach", "Bulgur", "Lemon"],
      meta: "540 kcal · 32P · 18m prep",
      badge: { text: "FROM PANTRY", tone: "brand" },
      kind: "meal",
    },
    {
      id: "p3",
      time: "18:00",
      label: "MOVE",
      title: "Evening walk",
      description:
        "A gentle aerobic block to close out the day's activity target.",
      tags: ["30 min", "Zone 2", "Easy"],
      kind: "activity",
    },
    {
      id: "p4",
      time: "19:30",
      label: "DINNER",
      title: "Salmon & greens",
      description:
        "Omega-3 rich — a repeat you rate highly, so we kept it on the plan.",
      tags: ["Salmon", "Asparagus", "Greens", "Olive oil"],
      meta: "560 kcal · 38P",
      badge: { text: "KEPT", tone: "brand" },
      kind: "meal",
    },
  ] as PlanItem[],
};

/* ---------- Progress ---------- */
export interface BarStat {
  label: string;
  pct: number;
  value: string;
  tone: "brand" | "caution";
}

export const trajectory = {
  caption: "GOAL TRAJECTORY · WEIGHT",
  headline: "3 weeks in — trending to goal by mid-August",
  start: "START 78.0kg",
  now: "NOW 76.3kg",
  goal: "GOAL 73kg",
  // polyline points (viewBox 0 0 320 96)
  line: "0,26 46,30 92,28 138,38 184,44 230,52 276,58 320,66",
  marker: { x: 276, y: 58 },
};

export const adherence: BarStat[] = [
  { label: "Dinners", pct: 80, value: "80%", tone: "brand" },
  { label: "Morning workouts", pct: 50, value: "50%", tone: "caution" },
];

export const adherenceNote =
  "Mornings are tough for you — **so we moved workouts to evenings.** No streak shaming here.";

export const nutrientBalance: (BarStat & { status: string })[] = [
  { label: "Protein", pct: 92, value: "met", status: "met", tone: "brand" },
  { label: "Fiber", pct: 78, value: "met", status: "met", tone: "brand" },
  { label: "Iron", pct: 44, value: "low", status: "low", tone: "caution" },
];

export const nutrientNote = "Iron's run low — this week leans on leafy greens.";

export const adaptationLog = [
  {
    title: "Moved workouts to evening",
    note: "You skipped 4 early ones · 2d ago",
  },
  { title: "Added spinach this week", note: "Iron ran low · 3d ago" },
  { title: "Kept Thursday salmon", note: "You rate it highly · 5d ago" },
];

/* ---------- Explore ---------- */
export const exploreFilters = [
  "All",
  "Articles",
  "Guides",
  "Recipes",
  "Community",
];

export const exploreFeature = {
  label: "DAILY TREND · 5 MIN",
  title: "The truth about protein timing",
  body: "When you eat it matters far less than how much. Here's what the research actually says.",
};

export const deepDives: ContentCard[] = [
  {
    id: "d1",
    kind: "guide",
    readTime: "8 MIN",
    title: "Understanding your macros",
    tone: "forecast",
  },
  {
    id: "d2",
    kind: "recipe",
    readTime: "25 MIN",
    title: "Sheet-pan harissa veg",
    tone: "brand",
  },
];

export const community = {
  title: "High-protein lunches under 15 minutes",
  count: "214 cooking this week",
};

/* ---------- Profile ---------- */
export const profile = {
  name: "Sam Rivera",
  email: "sam@email.com",
  day: 18,
  initial: "S",
  pro: true,
};

export const safetyFlags = [
  { label: "Peanut", danger: true },
  { label: "Shellfish", danger: true },
  { label: "Sodium cap · 1500mg", danger: false },
  { label: "Metformin flag", danger: false },
];

/* ---------- Kitchen ---------- */
export interface PantryItem {
  name: string;
  qty: string;
  tag: { text: string; tone: "brand" | "caution" };
}

export const pantry: PantryItem[] = [
  { name: "Chickpeas", qty: "2 cans", tag: { text: "FRESH", tone: "brand" } },
  {
    name: "Baby spinach",
    qty: "200 g",
    tag: { text: "USE IN 2D", tone: "caution" },
  },
  { name: "Greek yogurt", qty: "500 g", tag: { text: "FRESH", tone: "brand" } },
  {
    name: "Salmon fillet",
    qty: "2 portions · frozen",
    tag: { text: "FRESH", tone: "brand" },
  },
];

export const shoppingList = {
  aisle: "PRODUCE",
  items: [
    { name: "Lemons · 3", checked: true },
    { name: "Cherry tomatoes · 1 pack", checked: false },
    { name: "Cucumber · 1", checked: false },
  ],
};

/* ---------- Coach ---------- */
export const coachThread = {
  stamp: "TODAY · 13:42",
  user: "Low energy this afternoon — what can I eat in the next hour?",
  ai: "A quick hit of protein + slow carbs will steady you. This fits your afternoon:",
  suggestion: {
    title: "Yogurt, banana & walnuts",
    meta: "280 kcal · 18P · 2m",
    tags: ["Fits budget", "Safe for you"],
  },
};

// PREFERENCES

export const ACTIVITIES = [
  {
    key: "sitting",
    label: "Mostly sitting",
    factor: 1.2,
    level: "low",
    frequency: 1,
  },
  {
    key: "light",
    label: "Lightly active",
    factor: 1.375,
    level: "moderate",
    frequency: 3,
  },
  { key: "active", label: "Active", factor: 1.55, level: "high", frequency: 5 },
] as const;

export const GENDERS = [
  { key: "female", label: "Female" },
  { key: "male", label: "Male" },
  { key: "other", label: "Other" },
] as const;

export const PACES = [
  { key: "gentle", label: "Gentle", hint: "Easy does it" },
  { key: "steady", label: "Steady", hint: "Recommended" },
  { key: "ambitious", label: "Ambitious", hint: "Faster" },
] as const;

export const COOKING = [
  { key: "quick", label: "Quick", hint: "<20 MINS" },
  { key: "some_time", label: "Some time", hint: "20–40 MINS" },
  { key: "i_cook", label: "I cook", hint: "40+ MINS" },
] as const;

export const DIETS = [
  "Mediterranean",
  "No restriction",
  "Vegetarian",
  "Vegan",
  "Pescatarian",
  "Low-carb",
];
export const CUISINES = [
  "Italian",
  "Middle Eastern",
  "Japanese",
  "Indian",
  "Mexican",
];

export const GOAL_API: Record<string, string> = {
  lose: "weight_loss",
  maintain: "maintain",
  muscle: "muscle_gain",
  healthier: "eat_healthier",
};

export const DIET_API: Record<string, string[]> = {
  Mediterranean: ["mediterranean"],
  "No restriction": [],
  Vegetarian: ["vegetarian"],
  Vegan: ["vegan"],
  Pescatarian: ["pescatarian"],
  "Low-carb": ["low_carb"],
};

export const CALORIE_FLOOR = 1500;
