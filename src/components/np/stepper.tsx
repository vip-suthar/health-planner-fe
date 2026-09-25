"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/** Compact −/+ stepper with a centered value. */
export function Stepper({
  value,
  onChange,
  size = "md",
  className,
}: {
  value: React.ReactNode;
  onChange?: (dir: 1 | -1) => void;
  size?: "sm" | "md";
  className?: string;
}) {
  const btn =
    size === "sm"
      ? "size-[26px] rounded-lg"
      : "size-[38px] rounded-[11px]";
  const icon = size === "sm" ? "size-3" : "size-4";
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <button
        type="button"
        onClick={() => onChange?.(-1)}
        aria-label="Decrease"
        className={cn(
          "flex items-center justify-center border border-control-border bg-surface text-text-strong active:scale-95",
          btn,
        )}
      >
        <Minus className={icon} strokeWidth={2.4} />
      </button>
      <span className="min-w-12 text-center font-sans text-[13px] font-bold text-ink">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange?.(1)}
        aria-label="Increase"
        className={cn(
          "flex items-center justify-center bg-brand text-white active:scale-95",
          btn,
        )}
      >
        <Plus className={icon} strokeWidth={2.4} />
      </button>
    </div>
  );
}
