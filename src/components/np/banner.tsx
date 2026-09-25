import { cn } from "@/lib/utils";

/** Forecast-tinted info banner (e.g. "What changed"). */
export function InfoBanner({
  icon,
  title,
  children,
  action,
  onAction,
  className,
}: {
  icon?: React.ReactNode;
  title?: string;
  children: React.ReactNode;
  action?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-2.5 rounded-[14px] border border-forecast-border bg-coach-surface px-3 py-3",
        className,
      )}
    >
      {icon && <div className="mt-px flex-none text-forecast">{icon}</div>}
      <div className="flex-1">
        {title && (
          <div className="font-sans text-[12px] font-bold leading-[1.3] text-coach-text">
            {title}
          </div>
        )}
        <div className="mt-0.5 font-sans text-[12px] font-medium leading-[1.45] text-[#5a6671]">
          {children}
        </div>
        {action && (
          <button
            type="button"
            onClick={onAction}
            className="mt-2 font-sans text-[11px] font-semibold text-forecast active:opacity-70"
          >
            {action}
          </button>
        )}
      </div>
    </div>
  );
}
