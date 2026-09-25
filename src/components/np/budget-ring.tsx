import { cn } from "@/lib/utils";

interface BudgetRingProps {
  value: number;
  caption: string;
  /** fraction consumed 0..1 — controls how much of the ring is filled */
  percent: number;
  size?: number;
  className?: string;
}

const R = 44;
const STROKE = 11;
const CIRC = 2 * Math.PI * R; // ~276.5

export function BudgetRing({
  value,
  caption,
  percent,
  size = 104,
  className,
}: BudgetRingProps) {
  const clamped = Math.max(0, Math.min(1, percent));
  const offset = CIRC * (1 - clamped);
  return (
    <div
      className={cn("relative flex-none", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox="0 0 104 104">
        <circle
          cx="52"
          cy="52"
          r={R}
          fill="none"
          className="stroke-track"
          strokeWidth={STROKE}
        />
        <circle
          cx="52"
          cy="52"
          r={R}
          fill="none"
          className="stroke-brand"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          transform="rotate(-90 52 52)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-sans text-[23px] font-bold leading-none text-ink">
          {value}
        </span>
        <span className="mt-[3px] font-mono text-[9px] font-medium tracking-[0.03em] text-text-muted">
          {caption}
        </span>
      </div>
    </div>
  );
}
