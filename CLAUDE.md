# NutriPlan — mobile nutrition planner

Mobile-first, native-first web app implementing the **NutriPlan Redesign** (Claude Design project
`5e0d8b2e-c1b7-447b-b934-11ce49d5353e`). One 440px column; no desktop layout.

## Stack
- **Next.js 16** App Router, **React 19**, static export (`output: "export"` → `out/`).
- **Tailwind v4** (`@theme` in `src/app/globals.css`), **shadcn** on `@base-ui/react` (not Radix).
- **Capacitor** wraps `out/` as native iOS (`ios/`, Package.swift) + Android (`android/`).
- **lucide-react** icons, **sonner** toasts. Fonts: Hanken Grotesk (sans) + IBM Plex Mono (labels).

## Design system — the rule that matters
All colors/shadows/radii live as CSS vars in `globals.css` (`--np-*`) and are exposed as Tailwind
utilities via `@theme inline` (`bg-brand`, `text-ink`, `shadow-card`, `border-hairline`, …).
**Never hardcode hex in components** — use the token utilities. shadcn aliases (`--primary`, etc.)
are remapped to the NutriPlan palette so shadcn primitives render on-brand.

Status semantics (consistent everywhere): **green = firm/safe**, **dashed blue = provisional/
forecast**, **amber = caution/flag**.

## Layout
- `src/components/chrome/` — `AppShell` (tab screens: fixed TopBar + scroll body + FabStack +
  BottomNav), `TopBar`/`TitleTopBar`, `BottomNav`, `FabStack` (Coach + Add speed-dial),
  `BackHeader`, `FlowScreen`/`FlowCTA` (full-screen flows w/ sticky footer), `OnboardingShell`.
- `src/components/np/` — reusable primitives (BudgetRing, MacroBar, Timeline, MealCard,
  ContentCard, CoachNudge, StatTile/StatBar, DayChip, Chip, StatusBadge/SafeBadge, ListRow,
  Segmented, Stepper, OtpInput, selectable tiles/pills, …). Compose these; don't re-style inline.
- `src/lib/data.ts` — mock domain data (swap for API later). `src/lib/nav.ts` — bottom tabs.

## Screens → routes
Tabs: `/` Today (A1), `/plan` (B1), `/progress` (C1), `/explore` (C2), `/profile` (C3).
Also: `/coach`, `/kitchen`, `/safety`, `/recipe`, `/activity`, `/article`,
`/welcome`, `/auth/{email,verify}`,
`/onboarding/{preferences,safety}` (2-step cold start, Section H), `/plan/generating`.

## Commands
- `npm run dev` / `npm run build` (build = static export to `out/`).
- `npm run cap:sync` (build + `cap sync`), `cap:open:ios`, `cap:open:android`.
- Capacitor config: `capacitor.config.ts` (appId `io.medsnap.nutriplan`, webDir `out`).
