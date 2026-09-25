import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Grouped list container — white card with hairline-separated rows. */
export function ListGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-hairline bg-surface [&>*:not(:last-child)]:border-b [&>*]:border-[#eef1ef]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ListRow({
  icon,
  title,
  trailing,
  chevron = true,
  onClick,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  trailing?: React.ReactNode;
  chevron?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-3.5 py-3.5 text-left active:bg-surface-muted/60",
        className,
      )}
    >
      {icon && <span className="flex-none text-brand">{icon}</span>}
      <span className="flex-1 font-sans text-[13.5px] font-semibold text-[#2a332e]">
        {title}
      </span>
      {trailing}
      {chevron && <ChevronRight className="size-4 text-[#c2cac5]" strokeWidth={2} />}
    </button>
  );
}
