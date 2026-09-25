import { Shield } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadge = cva(
  "inline-flex items-center gap-1 rounded-md font-mono font-semibold uppercase",
  {
    variants: {
      tone: {
        brand: "bg-brand-surface text-brand-deep border border-brand-border",
        forecast: "bg-forecast-surface text-forecast",
        caution: "bg-caution-surface text-caution border border-caution-border",
        neutral: "bg-surface-muted text-text-muted",
      },
      size: {
        sm: "text-[9px] px-1.5 py-[3px]",
        md: "text-[10px] px-2 py-1",
      },
    },
    defaultVariants: { tone: "brand", size: "sm" },
  },
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadge> {}

export function StatusBadge({
  tone,
  size,
  className,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <span className={cn(statusBadge({ tone, size }), className)} {...props}>
      {children}
    </span>
  );
}

/** SAFE shield pill used in the top bar. */
export function SafeBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-[9px] border border-brand-border bg-brand-surface px-2.5 text-brand-deep",
        className,
      )}
    >
      <Shield className="size-3.5" strokeWidth={2} />
      <span className="font-mono text-[10px] font-semibold tracking-[0.04em]">
        SAFE
      </span>
    </span>
  );
}
