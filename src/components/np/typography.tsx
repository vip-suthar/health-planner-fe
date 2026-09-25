import { cn } from "@/lib/utils";

/** Small uppercase mono section label, e.g. TODAY'S TIMELINE. */
export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-mono text-[11px] font-semibold uppercase tracking-[0.07em] text-text-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Mono metadata / counts, e.g. 540 kcal · 32P · 18m. */
export function MonoMeta({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn("font-mono text-[11px] font-medium text-[#7e867f]", className)}
    >
      {children}
    </span>
  );
}

/** Screen title (700/21). */
export function ScreenTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h1
      className={cn(
        "font-sans text-[21px] font-bold leading-[1.2] tracking-[-0.01em] text-ink",
        className,
      )}
    >
      {children}
    </h1>
  );
}
