import { ChevronRight } from "lucide-react";
import { Eyebrow } from "./typography";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  label: string;
  action?: string;
  onAction?: () => void;
  withChevron?: boolean;
  className?: string;
}

export function SectionHeader({
  label,
  action,
  onAction,
  withChevron,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("mb-3 flex items-center justify-between", className)}>
      <Eyebrow>{label}</Eyebrow>
      {action && (
        <button
          type="button"
          onClick={onAction}
          className="flex items-center gap-0.5 font-sans text-[12px] font-semibold text-brand active:opacity-70"
        >
          {action}
          {withChevron && <ChevronRight className="size-3.5" strokeWidth={2.2} />}
        </button>
      )}
    </div>
  );
}
