import { Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

/** Dark-green movement card with a Start action. */
export function MovementCard({
  eyebrow,
  title,
  action = "Start",
  onAction,
  className,
}: {
  eyebrow: string;
  title: string;
  action?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[18px] bg-movement p-3.5",
        className,
      )}
    >
      <div className="flex size-[46px] flex-none items-center justify-center rounded-[13px] bg-white/10 text-[#9fd8bc]">
        <Dumbbell className="size-[22px]" strokeWidth={1.8} />
      </div>
      <div className="flex-1">
        <div className="font-mono text-[9px] font-medium tracking-[0.05em] text-[#9fd8bc]">
          {eyebrow}
        </div>
        <div className="mt-1.5 font-sans text-[15px] font-bold leading-[1.2] text-white">
          {title}
        </div>
      </div>
      <button
        type="button"
        onClick={onAction}
        className="flex h-9 items-center rounded-[10px] bg-white px-3.5 font-sans text-[12px] font-bold text-movement active:scale-[0.97]"
      >
        {action}
      </button>
    </div>
  );
}
