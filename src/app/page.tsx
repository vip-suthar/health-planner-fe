"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { AppShell } from "@/components/chrome/app-shell";
import { BudgetRing } from "@/components/np/budget-ring";
import { MacroBars } from "@/components/np/macro-bar";
import { CoachNudge } from "@/components/np/coach-nudge";
import { SectionHeader } from "@/components/np/section-header";
import { Timeline, TimelineNode } from "@/components/np/timeline";
import { TimelineCard } from "@/components/np/meal-card";
import { ContentCard } from "@/components/np/content-card";
import { Skeleton } from "@/components/np/skeleton";
import { Eyebrow, ScreenTitle } from "@/components/np/typography";
import { coachNudge, forYou, timeline as timelineMock } from "@/lib/data";
import useSWR from "swr";
import { useUser } from "@/lib/api/use-api";
import { data as dataApi, ApiError } from "@/lib/api";
import { mapBudget, mapTimeline } from "@/lib/mappers";
import { useDate } from "@/lib/hooks";

function greetingFor(date: Date, name: string) {
  const h = date.getHours();
  const part = h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
  return `Good ${part}, ${name}`;
}

export default function TodayPage() {
  const router = useRouter();
  const { date } = useDate();
  const {
    data: ledger,
    isLoading: ledgerLoading,
    mutate: refetchLedger,
  } = useSWR("/data/ledger/today", () => dataApi.getLedgerToday());
  const {
    data: planState,
    isLoading: planLoading,
    error: planError,
  } = useSWR("/data/plans/today", () => dataApi.getPlanToday());
  const { data: user, isLoading: greetingLoading } = useUser();

  // 202 = generation queued (no plan yet); 422 = preferences never saved.
  // Both are cold-start states with their own screen — never a mock timeline.
  useEffect(() => {
    if (planState?.state === "generating") {
      router.replace("/plan/generating");
    } else if (planError instanceof ApiError && planError.status === 422) {
      router.replace("/onboarding/preferences");
    }
  }, [planState, planError, router]);
  // Items logged this session — drives the "Logged" card (not the clock).
  const [logged, setLogged] = useState<Set<string>>(new Set());

  async function logItem(item: (typeof timeline)[number]) {
    // Real plan items carry a refTaskId as their id; mock fallback items don't.
    const isRef = /^(meal|activity)-(?!\d+$)/.test(item.id);
    try {
      await dataApi.logIntake({
        eventId: dataApi.newEventId(),
        type: item.kind === "activity" ? "activity" : "meal",
        data: isRef
          ? { refTaskId: item.id }
          : item.kind === "activity"
            ? { name: item.title, difficulty: "easy" }
            : { mealType: dataApi.mealTypeNow(), name: item.title },
      });
      setLogged((s) => new Set(s).add(item.id));
      toast.success(`Logged ${item.title}`);
      refetchLedger();
    } catch {
      toast.error("Could not log that — try again.");
    }
  }

  const budget = mapBudget(ledger);
  const plan = planState?.state === "ready" ? planState.plan : null;
  const timeline = (mapTimeline(plan) ?? timelineMock).map((it) =>
    logged.has(it.id) ? { ...it, status: "done" as const } : it,
  );
  const ringPercent = budget ? 1 - budget.kcalLeft / (budget.kcalGoal || 1) : 0;

  return (
    <AppShell>
      {/* greeting */}
      {greetingLoading ? (
        <div className="mb-4 space-y-2">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-3.5 w-48" />
        </div>
      ) : (
        user && (
          <div className="mb-4">
            <Eyebrow className="tracking-[0.08em] uppercase">
              {format(date, "EEE' • 'MMM dd' • week 'ww")}
            </Eyebrow>
            <ScreenTitle className="mt-1.5">
              {greetingFor(date, user?.name ?? "")}
            </ScreenTitle>
            {/* <div className="mt-1.5 flex items-center gap-1.5">
            <span className="size-1.75 rounded-full bg-brand" />
            <span className="font-sans text-[13px] font-medium leading-[1.3] text-[#4f5853]">
              {today.trend} — <b className="text-brand">{today.trendStatus}</b>
            </span>
          </div> */}
          </div>
        )
      )}

      {/* budget ring + macros */}
      {ledgerLoading ? (
        <div className="mb-4 flex items-center gap-4 rounded-xl border border-hairline bg-surface p-4">
          <Skeleton className="size-22 shrink-0 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-4/5" />
            <Skeleton className="h-3.5 w-3/5" />
          </div>
        </div>
      ) : (
        budget && (
          <div className="mb-4 flex items-center gap-4 rounded-xl border border-hairline bg-surface p-4">
            <BudgetRing
              value={budget.kcalLeft}
              caption="KCAL LEFT"
              percent={ringPercent}
            />
            <MacroBars macros={budget.macros} />
          </div>
        )
      )}

      <CoachNudge text={coachNudge} className="mb-4.5" />

      {/* timeline */}
      <SectionHeader label="Today's timeline" />
      {planLoading ? (
        <div className="mb-4.5 space-y-2.5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-22 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <Timeline className="mb-4.5">
          {timeline.map((item) => (
            <TimelineNode key={item.id} status={item.status}>
              <TimelineCard
                item={item}
                actions={{
                  onLog: () => logItem(item),
                  onSwap: () => router.push("/log/meal"),
                  onSkip: () => toast("Skipped for today"),
                }}
              />
            </TimelineNode>
          ))}
        </Timeline>
      )}

      {/* for you */}
      <SectionHeader
        label="For you"
        action="Explore"
        onAction={() => router.push("/explore")}
      />
      {/* TODO: enable once "for you" is data-driven
      {forYouLoading ? (
        <div className="flex gap-2.5">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-40 flex-1 rounded-xl" />
          ))}
        </div>
      ) : ( */}
      <div className="flex gap-2.5">
        {forYou.map((card) => (
          <ContentCard key={card.id} card={card} />
        ))}
      </div>
      {/* )} */}
    </AppShell>
  );
}
