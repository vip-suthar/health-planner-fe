"use client";

import { Fragment, useState } from "react";
import useSWR from "swr";
import { format, parseISO } from "date-fns";
import { Droplet, Plus, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/chrome/app-shell";
import { TitleTopBar } from "@/components/chrome/top-bar";
import { StatBar } from "@/components/np/stat-bar";
import { Segmented } from "@/components/np/segmented";
import { Skeleton } from "@/components/np/skeleton";
import { StatusBadge } from "@/components/np/status-badge";
import { LogSheet, type LogTarget } from "@/components/np/log-sheet";
import { Eyebrow } from "@/components/np/typography";
import { Button } from "@/components/ui/button";
import { adaptationLog, type BarStat } from "@/lib/data";
import { data as dataApi } from "@/lib/api";
import type { Progress } from "@/lib/api/data";
import { cn } from "@/lib/utils";

const RANGES = [
  { key: "7", label: "Week" },
  { key: "30", label: "Month" },
  { key: "90", label: "3 Months" },
];

const LOG_WEIGHT: LogTarget = { kind: "weight" };
const LOG_MEAL: LogTarget = { kind: "meal", mode: "custom" };
const LOG_ACTIVITY: LogTarget = { kind: "activity", mode: "custom" };
const LOG_WATER: LogTarget = { kind: "water" };

type CardKey = "weight" | "consistency" | "adherence" | "nutrition" | "activity" | "sleep" | "feel" | "water";

const ORDER: Record<string, CardKey[]> = {
  lose: ["weight", "adherence", "nutrition", "consistency", "activity", "sleep", "feel", "water"],
  muscle: ["weight", "nutrition", "activity", "adherence", "consistency", "sleep", "feel", "water"],
  maintain: ["weight", "consistency", "adherence", "nutrition", "activity", "sleep", "feel", "water"],
  other: ["consistency", "activity", "sleep", "feel", "adherence", "nutrition", "weight", "water"],
};

const NUTRIENTS = [
  { key: "calories", label: "Calories", unit: "kcal" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carbs", label: "Carbs", unit: "g" },
  { key: "fat", label: "Fat", unit: "g" },
  { key: "fiber", label: "Fiber", unit: "g" },
] as const;

const WHO_WEEKLY_MINUTES = 150;

const signedKg = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)} kg`;
const kcal = (v: number) => (Math.round(v / 10) * 10).toLocaleString();
const pctOf = (v: number, target: number) => (target > 0 ? Math.min(100, Math.round((v / target) * 100)) : 0);
const tone = (pct: number): BarStat["tone"] => (pct >= 80 ? "brand" : "neutral");
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function cardOrder(p: Progress): CardKey[] {
  const order = ORDER[p.goal.type ?? "other"] ?? ORDER.other;
  const early = !!p.goal.startedAt && Date.now() - Date.parse(p.goal.startedAt) < 14 * 86_400_000;
  if (order[0] !== "weight" || (p.goal.ready && !early)) return order;
  return ["consistency", "weight", ...order.filter((k) => k !== "consistency" && k !== "weight")];
}

export default function ProgressPage() {
  const [days, setDays] = useState("30");
  const [logTarget, setLogTarget] = useState<LogTarget | null>(null);
  const { data: p, error, isLoading, mutate } = useSWR(`/data/progress?days=${days}`, () =>
    dataApi.getProgress(Number(days)),
  );

  return (
    <AppShell topBar={<TitleTopBar title="Progress" />}>
      <Segmented className="mb-3.5" options={RANGES} value={days} onChange={setDays} />

      {isLoading ? (
        [0, 1, 2].map((i) => <Skeleton key={i} className="mb-3.5 h-40 w-full rounded-[18px]" />)
      ) : !p ? (
        error && (
          <Card title="Progress">
            <p className="mb-3 font-sans text-[13px] font-medium text-text-muted">
              Couldn&apos;t load your progress right now.
            </p>
            <Button variant="outline" size="sm" onClick={() => mutate()} className="gap-1.5">
              <RotateCcw className="size-3.5" /> Try again
            </Button>
          </Card>
        )
      ) : p.consistency.daysLogged === 0 && p.goal.weighIns === 0 ? (
        <Card title="Your progress">
          <div className="mb-3 font-sans text-[16px] font-bold leading-[1.3] text-ink">
            Your progress starts with your first log
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setLogTarget(LOG_WEIGHT)}>
              <Plus /> Log weight
            </Button>
            <Button size="sm" onClick={() => setLogTarget(LOG_MEAL)}>
              <Plus /> Log a meal
            </Button>
          </div>
        </Card>
      ) : (
        <Cards p={p} onLog={setLogTarget} />
      )}

      <LogSheet target={logTarget} onClose={() => setLogTarget(null)} />

      {/* adaptation log */}
      <Eyebrow className="mb-2.5 mt-1 block tracking-[0.07em]">Why your plan changed</Eyebrow>
      <div className="relative pl-[22px]">
        <div className="absolute left-[5px] top-1.5 bottom-1.5 w-0.5 bg-control-border" />
        {adaptationLog.map((entry) => (
          <div key={entry.title} className="relative mb-3 last:mb-0">
            <div className="absolute -left-[22px] top-[3px] size-[11px] rounded-full border-2 border-surface bg-brand" />
            <div className="font-sans text-[12.5px] font-semibold leading-[1.35] text-[#2a332e]">
              {entry.title}
            </div>
            <div className="mt-0.5 font-sans text-[11px] font-medium leading-[1.3] text-[#7e867f]">
              {entry.note}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

function Cards({ p, onLog }: { p: Progress; onLog: (t: LogTarget) => void }) {
  const cards: Record<CardKey, React.ReactNode> = {
    weight: <WeightCard p={p} onLog={onLog} />,
    consistency: <ConsistencyCard p={p} />,
    adherence: <AdherenceCard p={p} />,
    nutrition: <NutritionCard p={p} onLog={onLog} />,
    activity: <ActivityCard p={p} onLog={onLog} />,
    sleep: <SleepCard p={p} />,
    feel: <FeelCard p={p} />,
    water: <WaterStat p={p} onLog={onLog} />,
  };
  return cardOrder(p).map((k) => <Fragment key={k}>{cards[k]}</Fragment>);
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-3.5 rounded-[18px] border border-hairline bg-surface p-4">
      <Eyebrow className="mb-3 block tracking-[0.05em]">{title}</Eyebrow>
      {children}
    </section>
  );
}

function Headline({ children }: { children: React.ReactNode }) {
  return <div className="font-sans text-[16px] font-bold leading-[1.3] text-ink">{children}</div>;
}

function Coverage({ logged, days, unit = "days" }: { logged: number; days: number; unit?: string }) {
  return (
    <p className="mt-3 font-sans text-[11.5px] font-medium leading-[1.4] text-text-muted">
      Based on {logged} of {days} {unit}
    </p>
  );
}

function Note({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "mt-3 rounded-[11px] px-3 py-2.5 font-sans text-[12px] font-medium leading-[1.45]",
        className ?? "bg-surface-muted text-text-body",
      )}
    >
      {children}
    </p>
  );
}

function NoData({ label, onLog }: { label?: string; onLog?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[11px] bg-surface-muted px-3 py-2.5">
      <span className="font-sans text-[12px] font-medium text-text-muted">No data yet</span>
      {onLog && (
        <Button variant="outline" size="sm" onClick={onLog}>
          <Plus /> {label}
        </Button>
      )}
    </div>
  );
}

function WeightCard({ p, onLog }: { p: Progress; onLog: (t: LogTarget) => void }) {
  const g = p.goal;
  const need = Math.max(0, 3 - g.weighIns);
  const steady = g.type === "maintain" && g.changeKg != null && Math.abs(g.changeKg) <= 1.5;
  const away = g.remainingKg != null && g.weeklyRateKg != null && g.remainingKg * g.weeklyRateKg < 0;

  return (
    <Card title="Weight trend">
      {g.currentWeight != null && (
        <div className="flex items-baseline justify-between">
          <span className="font-sans text-[22px] font-extrabold leading-none text-ink">
            {g.currentWeight.toFixed(1)}{" "}
            <span className="text-[13px] font-semibold text-text-muted">kg</span>
          </span>
          {g.changeKg != null && (
            <span className={cn("font-mono text-[11px] font-semibold", steady ? "text-brand" : "text-text-body")}>
              {steady ? "Holding steady · " : ""}
              {signedKg(g.changeKg)} since start
            </span>
          )}
        </div>
      )}
      <WeightChart p={p} />

      {!g.ready ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-[11px] border border-dashed border-forecast-dashed bg-forecast-bg px-3 py-2.5">
          <span className="font-sans text-[12px] font-medium leading-[1.4] text-coach-text">
            {need > 0
              ? `Building your trend: log ${plural(need, "more weigh-in")}`
              : p.range.days === 7
                ? "Switch to Month to see your trend"
                : "Building your trend: keep weighing in over the week"}
          </span>
          <Button variant="outline" size="sm" onClick={() => onLog(LOG_WEIGHT)}>
            <Plus /> Log weight
          </Button>
        </div>
      ) : (
        <>
          {g.weeklyRateKg != null && (
            <div className="mt-3 font-mono text-[11px] font-semibold text-text-body">
              ≈{signedKg(g.weeklyRateKg)}/week
              {g.targetWeight != null && g.remainingKg != null && ` · ${Math.abs(g.remainingKg).toFixed(1)} kg to go`}
              {g.targetWeight != null && g.etaDate && ` · goal by ${format(parseISO(g.etaDate), "MMM d")}`}
            </div>
          )}
          {g.targetWeight != null && !g.etaDate && away && (
            <Note>
              Progress isn&apos;t always linear. Weight often stalls for 1–2 weeks from water retention.
              Keep going, your plan adapts.
            </Note>
          )}
          {g.weeklyRatePercent != null && g.weeklyRatePercent < -1 && (
            <Note className="border border-caution-border bg-caution-surface text-caution">
              You&apos;re losing faster than recommended. Make sure you&apos;re eating enough.
            </Note>
          )}
        </>
      )}
    </Card>
  );
}

function WeightChart({ p }: { p: Progress }) {
  const target = p.goal.targetWeight;
  const vals = p.daily.flatMap((d) => [d.weight, d.weightTrend]).filter((v): v is number => v != null);
  if (!vals.length) return null;
  if (target != null) vals.push(target);

  const min = Math.min(...vals) - 0.5;
  const max = Math.max(...vals) + 0.5;
  const n = p.daily.length;
  const x = (i: number) => (n > 1 ? 8 + (i / (n - 1)) * 304 : 160);
  const y = (v: number) => 88 - ((v - min) / (max - min)) * 80;
  const trend = p.daily
    .flatMap((d, i) => (d.weightTrend == null ? [] : [`${x(i)},${y(d.weightTrend)}`]))
    .join(" ");

  return (
    <>
      <svg viewBox="0 0 320 96" className="mt-3 w-full">
        {target != null && (
          <line x1="0" y1={y(target)} x2="320" y2={y(target)} stroke="var(--np-forecast-dashed)" strokeWidth="1.5" strokeDasharray="4 4" />
        )}
        {p.daily.map((d, i) =>
          d.weight == null ? null : (
            <circle key={d.date} cx={x(i)} cy={y(d.weight)} r="3" fill="var(--np-brand)" opacity="0.25" />
          ),
        )}
        <polyline points={trend} fill="none" stroke="var(--np-brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="mt-2 flex justify-between font-mono text-[10px] font-medium text-text-inactive">
        <span>{format(parseISO(p.range.from), "MMM d")}</span>
        {target != null && <span className="text-forecast-text">GOAL {target.toFixed(1)} kg</span>}
        <span>{format(parseISO(p.range.to), "MMM d")}</span>
      </div>
    </>
  );
}

function ConsistencyCard({ p }: { p: Progress }) {
  const c = p.consistency;
  const week = p.daily.slice(-7).filter((d) => d.logged).length;
  const lastWeek = p.daily.slice(-8, -1).filter((d) => d.logged).length;
  const cols = p.daily.length <= 7 ? 7 : 15;
  const sub =
    new Date().getDay() === 1 && lastWeek > 0
      ? `New week, let's build on last week's ${plural(lastWeek, "day")}.`
      : c.currentStreak > 0
        ? `${c.currentStreak}-day streak · best ${c.longestStreak}`
        : c.longestStreak > 0
          ? `Best streak ${plural(c.longestStreak, "day")}`
          : null;

  return (
    <Card title="Consistency">
      <div className="flex items-center justify-between gap-2">
        <Headline>
          {p.range.days === 7 ? `${week} of 7 days this week` : `${c.daysLogged} of ${c.days} days logged`}
        </Headline>
        {week >= 5 && <StatusBadge size="md">Great week</StatusBadge>}
      </div>
      {sub && <div className="mt-1 font-sans text-[11.5px] font-medium text-text-muted">{sub}</div>}
      <div className="mt-3 grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {p.daily.map((d) => (
          <div
            key={d.date}
            title={d.date}
            className={cn("rounded-[4px]", cols === 7 ? "h-7" : "aspect-square", d.logged ? "bg-brand" : "bg-track")}
          />
        ))}
      </div>
    </Card>
  );
}

function AdherenceCard({ p }: { p: Progress }) {
  const rows = (["meals", "activities"] as const).filter((k) => p.adherence[k].planned > 0);
  if (!rows.length) return null;

  return (
    <Card title="Plan adherence">
      <div className="flex flex-col gap-3">
        {rows.map((k) => {
          const a = p.adherence[k];
          const rate = Math.round(a.rate ?? (a.logged / a.planned) * 100);
          return (
            <div key={k}>
              <StatBar
                stat={{ label: k === "meals" ? "Meals" : "Activities", pct: rate, value: `${rate}%`, tone: tone(rate) }}
              />
              <div className="mt-1.5 font-sans text-[11px] font-medium text-text-muted">
                {a.logged} of {a.planned} {k}
                {a.skipped > 0 && ` · ${a.skipped} swapped/skipped`}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function NutritionCard({ p, onLog }: { p: Progress; onLog: (t: LogTarget) => void }) {
  const { average, target, daysLogged } = p.nutrition;

  return (
    <Card title="Nutrition · daily average">
      {!average ? (
        <NoData label="Log a meal" onLog={() => onLog(LOG_MEAL)} />
      ) : (
        <>
          <div className="flex flex-col gap-2.5">
            {NUTRIENTS.map(({ key, label, unit }) => {
              const fmt = key === "calories" ? kcal : (v: number) => String(Math.round(v));
              const t = target?.[key];
              const pct = t ? pctOf(average[key], t) : 0;
              return (
                <StatBar
                  key={key}
                  stat={{
                    label,
                    pct,
                    value: t ? `${fmt(average[key])} / ${fmt(t)} ${unit}` : `${fmt(average[key])} ${unit}`,
                    tone: tone(pct),
                  }}
                />
              );
            })}
          </div>
          <Coverage logged={daysLogged} days={p.range.days} />
        </>
      )}
    </Card>
  );
}

function ActivityCard({ p, onLog }: { p: Progress; onLog: (t: LogTarget) => void }) {
  const a = p.activity;
  const target = a.weeklyTargetMinutes ?? WHO_WEEKLY_MINUTES;
  const minutes = Math.round(a.weeklyMinutes);
  const pct = pctOf(minutes, target);

  return (
    <Card title="Activity">
      {a.daysLogged === 0 ? (
        <NoData label="Log activity" onLog={() => onLog(LOG_ACTIVITY)} />
      ) : (
        <>
          <StatBar stat={{ label: "Weekly minutes", pct, value: `${minutes} / ${target} min`, tone: tone(pct) }} />
          <Coverage logged={a.daysLogged} days={p.range.days} />
        </>
      )}
    </Card>
  );
}

function SleepCard({ p }: { p: Progress }) {
  const s = p.sleep;
  const values = p.daily.map((d) => d.sleepHours?.value ?? null);
  const target = p.daily.find((d) => d.sleepHours?.target != null)?.sleepHours?.target ?? null;

  return (
    <Card title="Sleep patterns">
      {s.averageHours == null ? (
        <NoData />
      ) : (
        <>
          <Headline>
            {s.averageHours.toFixed(1)} h avg · {s.nightsOnTarget} of {s.nightsLogged} nights on target
          </Headline>
          <DailyBars values={values} target={target} />
          <Coverage logged={s.nightsLogged} days={p.range.days} unit="nights" />
        </>
      )}
    </Card>
  );
}

function DailyBars({ values, target }: { values: (number | null)[]; target: number | null }) {
  const max = Math.max(target ?? 0, ...values.map((v) => v ?? 0)) || 1;
  return (
    <div className="relative mt-3 flex h-16 items-end gap-px">
      {target != null && (
        <div
          className="absolute inset-x-0 border-t border-dashed border-forecast-dashed"
          style={{ bottom: `${(target / max) * 100}%` }}
        />
      )}
      {values.map((v, i) => (
        <div
          key={i}
          className={cn("flex-1 rounded-t-[2px]", target != null && v != null && v >= target ? "bg-brand" : "bg-border-strong")}
          style={{ height: v == null ? 0 : `${(v / max) * 100}%` }}
        />
      ))}
    </div>
  );
}

function FeelCard({ p }: { p: Progress }) {
  const rows = [
    { label: "Mood", stat: p.mood, values: p.daily.map((d) => d.mood) },
    { label: "Energy", stat: p.energy, values: p.daily.map((d) => d.energy) },
  ].filter((r) => r.stat.entries >= 3 && r.stat.average != null);
  if (!rows.length) return null;

  return (
    <Card title="Mood & energy patterns">
      <div className="flex flex-col gap-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3">
            <span className="w-14 font-sans text-[12px] font-semibold text-text-strong">{r.label}</span>
            <Sparkline values={r.values} />
            <span className="w-12 text-right font-mono text-[11px] font-semibold text-text-body">
              {r.stat.average!.toFixed(1)}/5
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Sparkline({ values }: { values: (number | null)[] }) {
  const n = values.length;
  const points = values
    .flatMap((v, i) => (v == null ? [] : [`${n > 1 ? (i / (n - 1)) * 100 : 50},${28 - ((v - 1) / 4) * 24}`]))
    .join(" ");
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-8 min-w-0 flex-1">
      <polyline
        points={points}
        fill="none"
        stroke="var(--np-brand)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function WaterStat({ p, onLog }: { p: Progress; onLog: (t: LogTarget) => void }) {
  const w = p.water;
  return (
    <div className="mb-3.5 flex items-center gap-2.5 rounded-[18px] border border-hairline bg-surface px-4 py-3">
      <Droplet className="size-4 text-brand-deep" strokeWidth={2} />
      <span className="flex-1 font-sans text-[12.5px] font-semibold text-text-strong">
        {w.daysLogged > 0 ? `Hit water goal ${w.daysOnTarget} of ${p.range.days} days` : "No water logged yet"}
      </span>
      <button type="button" onClick={() => onLog(LOG_WATER)} className="font-sans text-[12px] font-semibold text-brand">
        Log
      </button>
    </div>
  );
}
