"use client";

import { Check, Dumbbell } from "lucide-react";
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
  onSwap?: () => void;
  onSkip?: () => void;
}

export function LoggedMealCard({ item }: { item: TimelineItem }) {
  return (
    <div className="rounded-[14px] border border-hairline bg-surface-muted px-3 py-2.5 opacity-80">
      <div className="flex items-center justify-between">
        <Eyebrow>
          {item.time} · {item.label}
        </Eyebrow>
        <span className="font-sans text-[10px] font-semibold text-brand">
          Logged ✓
        </span>
      </div>
      <div className="mt-1.5 font-sans text-[14px] font-semibold leading-[1.2] text-[#4f5853] line-through decoration-[#bfc6c1]">
        {item.title}
      </div>
    </div>
  );
}

/** Meal card with Log/Swap/Skip. `emphasis` highlights the current (now) meal. */
export function MealActionCard({
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
          variant="outline"
          onClick={actions?.onSwap}
          className="h-9 rounded-[10px] border-control-border text-[13px] text-text-strong"
        >
          Swap
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

export function ActivityCard({
  item,
  actions,
}: {
  item: TimelineItem;
  actions?: MealActions;
}) {
  const done = item.status === "done";
  return (
    <div
      className={cn(
        "rounded-[14px] border bg-surface px-3 py-2.5",
        done ? "border-hairline bg-surface-muted opacity-80" : "border-hairline",
      )}
    >
      <div className="flex items-center gap-2.5">
        <Dumbbell className="size-[18px] text-[#5b7a8c]" strokeWidth={1.8} />
        <div className="flex-1">
          <Eyebrow>
            {item.time} · {item.label}
          </Eyebrow>
          <div
            className={cn(
              "mt-0.5 font-sans text-[14px] font-bold leading-[1.2]",
              done ? "text-[#4f5853] line-through decoration-[#bfc6c1]" : "text-ink",
            )}
          >
            {item.title}
          </div>
          {item.meta && <MonoMeta className="mt-1 block">{item.meta}</MonoMeta>}
        </div>
        {done ? (
          <span className="font-sans text-[10px] font-semibold text-brand">Done ✓</span>
        ) : (
          <Button
            onClick={actions?.onLog}
            className="h-8 rounded-[10px] px-3 text-[12.5px]"
          >
            <Check className="size-3.5" strokeWidth={2.6} />
            Log
          </Button>
        )}
      </div>
    </div>
  );
}

export function ProvisionalMealCard({ item }: { item: TimelineItem }) {
  return (
    <div className="rounded-[14px] border-[1.5px] border-dashed border-forecast-dashed bg-forecast-bg px-3 py-2.5">
      <div className="flex items-center justify-between">
        <Eyebrow tone="forecast">
          {item.time} · {item.label}
        </Eyebrow>
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
  if (item.kind === "activity") return <ActivityCard item={item} actions={actions} />;
  if (item.status === "done") return <LoggedMealCard item={item} />;
  if (item.status === "provisional") return <ProvisionalMealCard item={item} />;
  return <MealActionCard item={item} actions={actions} emphasis={item.status === "now"} />;
}
