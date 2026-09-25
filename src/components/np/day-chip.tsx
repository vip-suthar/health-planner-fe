"use client";

import type { PlanDay } from "@/lib/data";
import { cn } from "@/lib/utils";

export function DayChip({
  day,
  selected,
  onClick,
}: {
  day: PlanDay;
  selected?: boolean;
  onClick?: () => void;
}) {
  const provisional = day.state === "provisional";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-[46px] flex-none flex-col items-center gap-1.5 rounded-[14px] py-2.5 transition-colors active:scale-[0.97]",
        selected
          ? "bg-brand text-white shadow-lifted"
          : provisional
            ? "border-[1.5px] border-dashed border-forecast-dashed bg-forecast-bg text-[#7e8b98]"
            : "border border-control-border bg-surface text-text-strong",
      )}
    >
      <span
        className={cn(
          "font-mono text-[9px] font-semibold",
          selected ? "opacity-85" : provisional ? "" : "text-text-muted",
        )}
      >
        {day.weekday}
      </span>
      <span className="font-sans text-[16px] font-bold leading-none">{day.date}</span>
      <span
        className={cn(
          "size-[5px] rounded-full",
          selected
            ? "bg-white"
            : day.dotTone === "forecast"
              ? "bg-[#9db4d0]"
              : "bg-brand",
        )}
      />
    </button>
  );
}
