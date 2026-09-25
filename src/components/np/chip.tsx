import { cn } from "@/lib/utils";

/** Ingredient / attribute chip — muted surface, rounded. */
export function Chip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "rounded-lg bg-surface-muted px-2 py-1.5 font-sans text-[10px] font-semibold text-text-strong",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Pill filter chip (outlined or active). */
export function FilterChip({
  children,
  active,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-full px-3.5 py-2 font-sans text-[12px] font-semibold transition-colors active:scale-[0.97]",
        active
          ? "bg-brand text-white"
          : "border border-border-strong bg-surface text-text-strong",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
