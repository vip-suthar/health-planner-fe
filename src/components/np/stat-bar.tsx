import type { BarStat } from "@/lib/data";
import { cn } from "@/lib/utils";

/** Labeled horizontal bar with a value on the right (Progress screen). */
export function StatBar({
  stat,
  inline,
  className,
}: {
  stat: BarStat;
  /** inline = label left, bar middle, value right (nutrient balance) */
  inline?: boolean;
  className?: string;
}) {
  const fill = stat.tone === "brand" ? "bg-brand" : "bg-caution";
  const valueColor = stat.tone === "brand" ? "text-brand" : "text-caution";

  if (inline) {
    return (
      <div className={cn("flex items-center gap-2.5", className)}>
        <span className="w-16 font-sans text-[12px] font-semibold text-text-strong">
          {stat.label}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-track">
          <div className={cn("h-full rounded-full", fill)} style={{ width: `${stat.pct}%` }} />
        </div>
        <span className={cn("w-10 text-right font-mono text-[10px] font-semibold", valueColor)}>
          {stat.value}
        </span>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-1.5 flex justify-between">
        <span className="font-sans text-[12px] font-semibold text-text-strong">
          {stat.label}
        </span>
        <span className={cn("font-mono text-[11px] font-semibold", valueColor)}>
          {stat.value}
        </span>
      </div>
      <div className="h-[7px] overflow-hidden rounded-full bg-track">
        <div className={cn("h-full rounded-full", fill)} style={{ width: `${stat.pct}%` }} />
      </div>
    </div>
  );
}
