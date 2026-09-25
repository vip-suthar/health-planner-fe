import type { Macro, MacroKey } from "@/lib/data";
import { cn } from "@/lib/utils";

const TONE: Record<MacroKey, string> = {
  protein: "bg-brand",
  carbs: "bg-forecast",
  fat: "bg-caution",
};

export function MacroBar({ macro }: { macro: Macro }) {
  const pct = Math.min(100, Math.round((macro.value / macro.goal) * 100));
  return (
    <div>
      <div className="mb-1.5 flex justify-between">
        <span className="font-sans text-[11px] font-semibold text-text-strong">
          {macro.label}
        </span>
        <span className="font-mono text-[10px] font-medium text-text-muted">
          {macro.value}/{macro.goal}
          {macro.unit}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-track">
        <div
          className={cn("h-full rounded-full", TONE[macro.key])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function MacroBars({
  macros,
  className,
}: {
  macros: Macro[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-1 flex-col gap-2.5", className)}>
      {macros.map((m) => (
        <MacroBar key={m.key} macro={m} />
      ))}
    </div>
  );
}
