import { cn } from "@/lib/utils";

/** Allergen/limit chip. danger = red allergen flag, else neutral limit. */
export function SafetyChip({
  label,
  danger,
  className,
}: {
  label: string;
  danger?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "rounded-lg px-2.5 py-1.5 font-sans text-[11px] font-semibold",
        danger
          ? "border border-[#e6c9c7] bg-[#f6eae9] text-[#9a3d38]"
          : "bg-surface-muted text-text-strong",
        className,
      )}
    >
      {danger ? `⚠ ${label}` : label}
    </span>
  );
}
