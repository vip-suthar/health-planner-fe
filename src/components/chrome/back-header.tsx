"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/** Top bar with a back chevron + title; used by Kitchen, detail, auth, etc. */
export function BackHeader({
  title,
  right,
  onBack,
  solid,
  className,
}: {
  title?: React.ReactNode;
  right?: React.ReactNode;
  onBack?: () => void;
  solid?: boolean;
  className?: string;
}) {
  const router = useRouter();
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-[var(--np-topbar-h)] items-center gap-3 border-b border-hairline px-3.5",
        solid ? "bg-surface" : "bg-app-bg/95 backdrop-blur-md",
        className,
      )}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <button
        type="button"
        onClick={() => (onBack ? onBack() : router.back())}
        aria-label="Back"
        className="flex size-[34px] items-center justify-center rounded-[10px] border border-control-border bg-surface text-text-strong active:scale-95"
      >
        <ChevronLeft className="size-[17px]" strokeWidth={2} />
      </button>
      {title && (
        <span className="flex-1 font-sans text-[17px] font-extrabold tracking-[-0.01em] text-ink">
          {title}
        </span>
      )}
      {right}
    </header>
  );
}
