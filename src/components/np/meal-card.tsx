"use client";

import { Check, Dumbbell, Utensils } from "lucide-react";
import type { TimelineItem } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import { MonoMeta } from "./typography";
import { cn } from "@/lib/utils";

function Eyebrow({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "brand" | "forecast";
}) {
  return (
    <span
      className={cn(
        "font-mono text-[10px] font-medium tracking-[0.04em]",
        tone === "brand" && "text-brand",
        tone === "forecast" && "text-forecast-text",
        tone === "muted" && "text-text-muted",
      )}
    >
      {children}
    </span>
  );
}

export interface MealActions {
  onLog?: () => void;
  onSkip?: () => void;
}

/** Top-right MEAL / ACTIVITY tag so the two kinds read apart at a glance. */
function KindBadge({ kind }: { kind: TimelineItem["kind"] }) {
  const Icon = kind === "activity" ? Dumbbell : Utensils;
  return (
    <StatusBadge tone="neutral" className="ml-auto">
      <Icon className="size-2.5" strokeWidth={2.2} />
      {kind === "activity" ? "Activity" : "Meal"}
    </StatusBadge>
  );
}

export function LoggedCard({ item }: { item: TimelineItem }) {
  const skipped = item.status === "skipped";
  return (
    <div className="rounded-[14px] border border-hairline bg-surface-muted px-3 py-2.5 opacity-80">
      <div className="flex items-center gap-1.5">
        <Eyebrow>
          {item.time} · {item.label}
        </Eyebrow>
        <KindBadge kind={item.kind} />
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span
          className={cn(
            "font-sans text-[14px] font-semibold leading-[1.2] text-[#4f5853]",
            !skipped && "line-through decoration-[#bfc6c1]",
          )}
        >
          {item.title}
        </span>
        {skipped ? (
          <span className="flex-none font-sans text-[10px] font-semibold text-text-muted">Skipped</span>
        ) : (
          <span className="flex-none font-sans text-[10px] font-semibold text-brand">
            {item.kind === "activity" ? "Done ✓" : "Logged ✓"}
          </span>
        )}
      </div>
    </div>
  );
}

/** Meal/activity card with Log/Skip. `emphasis` highlights the current (now) item. */
export function TaskCard({
  item,
  actions,
  emphasis,
}: {
  item: TimelineItem;
  actions?: MealActions;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-surface p-3.5",
        emphasis
          ? "border-[1.5px] border-brand-border shadow-card"
          : "border border-hairline",
      )}
    >
      <div className="flex items-center gap-1.5">
        <Eyebrow tone={emphasis ? "brand" : "muted"}>
          {item.time} · {item.label}
        </Eyebrow>
        {item.fromPantry && <StatusBadge tone="brand">FROM PANTRY</StatusBadge>}
        <KindBadge kind={item.kind} />
      </div>
      <div className="mt-1.5 font-sans text-[15px] font-bold leading-[1.25] text-ink">
        {item.title}
      </div>
      {item.meta && <MonoMeta className="mt-1.5 block">{item.meta}</MonoMeta>}
      <div className="mt-3 flex gap-2">
        <Button onClick={actions?.onLog} className="h-9 flex-1 rounded-[10px] text-[13px]">
          <Check className="size-3.5" strokeWidth={2.6} />
          Log it
        </Button>
        <Button
          variant="ghost"
          onClick={actions?.onSkip}
          className="h-9 rounded-[10px] px-3 text-[13px] text-text-inactive"
        >
          Skip
        </Button>
      </div>
    </div>
  );
}

export function ProvisionalCard({ item }: { item: TimelineItem }) {
  return (
    <div className="rounded-[14px] border-[1.5px] border-dashed border-forecast-dashed bg-forecast-bg px-3 py-2.5">
      <div className="flex items-center gap-1.5">
        <Eyebrow tone="forecast">
          {item.time} · {item.label}
        </Eyebrow>
        <KindBadge kind={item.kind} />
        <StatusBadge tone="forecast">PROVISIONAL</StatusBadge>
      </div>
      <div className="mt-1.5 font-sans text-[14px] font-semibold leading-[1.2] text-[#54616e]">
        {item.title}
      </div>
    </div>
  );
}

/** Dispatches to the right card by item status/kind. */
export function TimelineCard({
  item,
  actions,
}: {
  item: TimelineItem;
  actions?: MealActions;
}) {
  if (item.status === "done" || item.status === "skipped") return <LoggedCard item={item} />;
  if (item.status === "provisional") return <ProvisionalCard item={item} />;
  return <TaskCard item={item} actions={actions} emphasis={item.status === "now"} />;
}
