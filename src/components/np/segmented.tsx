"use client";

import { cn } from "@/lib/utils";

export interface SegmentOption {
  key: string;
  label: React.ReactNode;
}

export function Segmented({
  options,
  value,
  onChange,
  className,
}: {
  options: SegmentOption[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1 rounded-xl bg-[#ecefec] p-1", className)}>
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={cn(
              "flex-1 rounded-[9px] py-[9px] text-center font-sans text-[13px] transition-colors",
              active
                ? "bg-surface font-bold text-ink shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                : "font-semibold text-[#7e867f]",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
