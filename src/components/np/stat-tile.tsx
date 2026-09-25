import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  subTone?: "brand" | "muted" | "caution";
  className?: string;
}

const SUB_TONE = {
  brand: "text-brand",
  muted: "text-text-body",
  caution: "text-caution",
};

export function StatTile({
  label,
  value,
  sub,
  subTone = "muted",
  className,
}: StatTileProps) {
  return (
    <div
      className={cn(
        "flex-1 rounded-[15px] border border-hairline bg-surface p-3",
        className,
      )}
    >
      <div className="font-mono text-[9px] font-medium tracking-[0.04em] text-text-muted uppercase">
        {label}
      </div>
      <div className="mt-[7px] font-sans text-[19px] font-extrabold leading-none text-ink">
        {value}
      </div>
      {sub != null && (
        <div className={cn("mt-[3px] font-sans text-[10px] font-medium", SUB_TONE[subTone])}>
          {sub}
        </div>
      )}
    </div>
  );
}
