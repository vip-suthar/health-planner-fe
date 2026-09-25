import { Check } from "lucide-react";
import type { ItemStatus } from "@/lib/data";
import { cn } from "@/lib/utils";

export function Timeline({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative pl-[26px]", className)}>
      {/* rail */}
      <div className="absolute left-[7px] top-2 bottom-2.5 w-0.5 bg-control-border" />
      {children}
    </div>
  );
}

function Dot({ status }: { status: ItemStatus }) {
  if (status === "done") {
    return (
      <div className="absolute -left-[26px] top-[3px] flex size-4 items-center justify-center rounded-full bg-brand">
        <Check className="size-2.5 text-white" strokeWidth={3} />
      </div>
    );
  }
  if (status === "now") {
    return (
      <div className="absolute -left-[27px] top-0.5 size-[18px] rounded-full border-[3px] border-brand bg-surface" />
    );
  }
  if (status === "provisional") {
    return (
      <div className="absolute -left-[26px] top-[3px] size-4 rounded-full border-2 border-dashed border-[#9db4d0] bg-forecast-surface" />
    );
  }
  return (
    <div className="absolute -left-[26px] top-[3px] size-4 rounded-full border-2 border-[#c7cfca] bg-surface" />
  );
}

export function TimelineNode({
  status,
  children,
  className,
}: {
  status: ItemStatus;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative mb-3.5 last:mb-0", className)}>
      <Dot status={status} />
      {children}
    </div>
  );
}
