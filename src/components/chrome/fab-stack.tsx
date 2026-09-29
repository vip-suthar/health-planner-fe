"use client";

import { useState } from "react";
import {
  Apple,
  Droplet,
  Dumbbell,
  Plus,
  Scale,
  Smile,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LogSheet, type LogTarget } from "@/components/np/log-sheet";
import { useCoachUi } from "@/lib/coach/store";
import { cn } from "@/lib/utils";

interface LogOption {
  key: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  target: LogTarget;
}

const LOG_OPTIONS: LogOption[] = [
  { key: "meal", label: "Log a meal", hint: "Anything you ate", icon: Apple, target: { kind: "meal", mode: "custom" } },
  { key: "water", label: "Water", hint: "Add a glass", icon: Droplet, target: { kind: "water" } },
  { key: "weight", label: "Weight", hint: "Today's reading", icon: Scale, target: { kind: "weight" } },
  { key: "activity", label: "Activity", hint: "Movement & exercise", icon: Dumbbell, target: { kind: "activity", mode: "custom" } },
  { key: "feel", label: "How I feel", hint: "Energy & symptoms", icon: Smile, target: { kind: "feel" } },
];

export function FabStack({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [logTarget, setLogTarget] = useState<LogTarget | null>(null);
  const openCoach = useCoachUi((s) => s.openCoach);

  return (
    <>
      <div
        className={cn(
          "pointer-events-none absolute bottom-[76px] right-4 z-40 flex flex-col items-center gap-[11px]",
          className,
        )}
      >
        <button
          type="button"
          onClick={openCoach}
          aria-label="Ask coach"
          className="pointer-events-auto flex size-[46px] items-center justify-center rounded-[15px] border border-[#dce6e0] bg-surface text-brand shadow-fab-soft active:scale-95"
        >
          <Sparkles className="size-5 fill-brand" />
        </button>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Add a log"
          className="pointer-events-auto flex size-[56px] items-center justify-center rounded-[18px] bg-brand text-white shadow-fab active:scale-95"
        >
          <Plus className="size-6" strokeWidth={2.4} />
        </button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto max-w-[440px] rounded-t-[24px] border-hairline pb-[max(env(safe-area-inset-bottom),16px)]"
        >
          <SheetHeader className="pb-1">
            <SheetTitle className="font-sans text-[18px] font-extrabold tracking-[-0.01em] text-ink">
              What would you like to log?
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-2 px-4">
            {LOG_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setLogTarget(opt.target);
                  }}
                  className="flex items-center gap-3 rounded-[14px] border border-hairline bg-surface p-3 text-left active:scale-[0.99]"
                >
                  <span className="flex size-10 flex-none items-center justify-center rounded-[12px] bg-brand-surface text-brand-deep">
                    <Icon className="size-5" strokeWidth={1.9} />
                  </span>
                  <span className="flex-1">
                    <span className="block font-sans text-[14px] font-bold text-ink">
                      {opt.label}
                    </span>
                    <span className="block font-sans text-[12px] text-text-body">
                      {opt.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
      <LogSheet target={logTarget} onClose={() => setLogTarget(null)} />
    </>
  );
}
