import { cn } from "@/lib/utils";

/** Pulsing placeholder block. Use to mirror real content while data loads. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-surface-muted",
        className,
      )}
    />
  );
}
