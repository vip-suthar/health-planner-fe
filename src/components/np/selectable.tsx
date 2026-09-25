"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Rounded pill choice; shows a check when selected. */
export function ChoicePill({
  label,
  selected,
  onClick,
  className,
}: {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3.5 py-2.5 font-sans text-[13px] transition-colors active:scale-[0.97]",
        selected
          ? "bg-brand font-bold text-white"
          : "border border-control-border bg-surface font-semibold text-text-strong",
        className,
      )}
    >
      {selected && <Check className="size-3.5" strokeWidth={2.6} />}
      {label}
    </button>
  );
}

/** Big icon tile (goal chooser, log chooser). */
export function OptionTile({
  icon,
  label,
  selected,
  onClick,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[14px] p-3.5 text-left transition-colors active:scale-[0.98]",
        selected ? "bg-brand text-white" : "border border-hairline bg-surface",
        className,
      )}
    >
      <span className={selected ? "text-white" : "text-[#5b6a63]"}>{icon}</span>
      <div
        className={cn(
          "mt-2.5 font-sans text-[14px] font-bold leading-[1.2]",
          selected ? "text-white" : "text-ink",
        )}
      >
        {label}
      </div>
    </button>
  );
}

/** Centered label + hint tile (pace, cooking time). */
export function SegmentTile({
  label,
  hint,
  selected,
  onClick,
  className,
}: {
  label: string;
  hint: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-[11px] py-2.5 text-center transition-colors active:scale-[0.98]",
        selected
          ? "border-[1.5px] border-brand bg-brand-surface"
          : "border border-hairline bg-surface",
        className,
      )}
    >
      <div className={cn("font-sans text-[13px] font-bold", selected ? "text-movement" : "text-ink")}>
        {label}
      </div>
      <div className={cn("mt-1 font-mono text-[9px] font-medium", selected ? "text-brand" : "text-text-muted")}>
        {hint}
      </div>
    </button>
  );
}
