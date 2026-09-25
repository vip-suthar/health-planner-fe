import { cn } from "@/lib/utils";

/** Horizontal rule with a centered mono label. */
export function LabeledDivider({
  children,
  dashed,
  tone = "muted",
  className,
}: {
  children: React.ReactNode;
  dashed?: boolean;
  tone?: "muted" | "forecast";
  className?: string;
}) {
  const line = dashed
    ? "h-[1.5px] flex-1 bg-[repeating-linear-gradient(90deg,#c9d6e5,#c9d6e5_5px,transparent_5px,transparent_10px)]"
    : "h-px flex-1 bg-hairline";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className={line} />
      <span
        className={cn(
          "font-mono text-[9px] font-semibold uppercase tracking-[0.06em]",
          tone === "forecast" ? "text-forecast-text" : "text-text-muted",
        )}
      >
        {children}
      </span>
      <span className={line} />
    </div>
  );
}
