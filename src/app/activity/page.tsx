"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Dumbbell, Play, Sparkles } from "lucide-react";
import { BackHeader } from "@/components/chrome/back-header";
import { FlowScreen } from "@/components/chrome/flow-screen";

const STATS = [
  { value: "30min", label: "DURATION" },
  { value: "Zone 2", label: "INTENSITY" },
  { value: "~160", label: "KCAL BURN" },
];

const STRUCTURE = [
  { title: "Warm-up · 5 min", note: "Easy pace, loosen up.", active: false },
  { title: "Steady walk · 20 min", note: "Conversational pace — you can still talk.", active: true },
  { title: "Cool-down · 5 min", note: "Slow down, light stretch.", active: false },
];

export default function ActivityPage() {
  const router = useRouter();
  return (
    <FlowScreen
      header={<BackHeader title="Activity brief" />}
      footer={
        <div className="flex gap-2.5">
          <button
            onClick={() => toast("Workout started")}
            className="flex h-[50px] flex-1 items-center justify-center gap-1.5 rounded-[15px] bg-movement font-sans text-[14px] font-bold text-white active:scale-[0.99]"
          >
            <Play className="size-4 fill-white" strokeWidth={2.2} />
            Start
          </button>
          <button
            onClick={() => {
              toast.success("Marked done");
              router.back();
            }}
            className="flex h-[50px] items-center gap-1.5 rounded-[15px] border border-control-border bg-surface px-[18px] font-sans text-[14px] font-semibold text-text-strong active:scale-[0.99]"
          >
            <Check className="size-3.5" strokeWidth={2.4} />
            Done
          </button>
        </div>
      }
      bodyClassName="p-4"
    >
      {/* dark hero */}
      <div className="mb-3.5 rounded-[18px] bg-movement p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-12 flex-none items-center justify-center rounded-[14px] bg-[#9fd8bc]/16 text-[#9fd8bc]">
            <Dumbbell className="size-6" strokeWidth={1.8} />
          </div>
          <div>
            <div className="font-mono text-[9px] font-medium tracking-[0.05em] text-[#9fd8bc]">
              18:00 · MOVE
            </div>
            <div className="mt-1 font-sans text-[19px] font-extrabold leading-[1.15] text-white">
              Evening walk
            </div>
          </div>
        </div>
        <p className="mt-3 font-sans text-[12.5px] font-medium leading-[1.5] text-[#c9e5d6]">
          A gentle aerobic block to close out the day&apos;s activity target without taxing recovery.
        </p>
      </div>

      {/* stats */}
      <div className="mb-4 flex gap-2">
        {STATS.map((s) => (
          <div key={s.label} className="flex-1 rounded-xl border border-hairline bg-surface p-2.5 text-center">
            <div className="font-sans text-[16px] font-bold text-ink">{s.value}</div>
            <div className="mt-1 font-mono text-[9px] font-medium text-text-muted">{s.label}</div>
          </div>
        ))}
      </div>

      {/* structure */}
      <div className="mb-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted">
        Structure
      </div>
      <div className="relative mb-4 pl-6">
        <div className="absolute left-1.5 top-1.5 bottom-1.5 w-0.5 bg-control-border" />
        {STRUCTURE.map((s) => (
          <div key={s.title} className="relative mb-3 last:mb-0">
            <div
              className={
                s.active
                  ? "absolute -left-6 top-0.5 size-[13px] rounded-full border-2 border-surface bg-brand"
                  : "absolute -left-6 top-0.5 size-[13px] rounded-full border-2 border-[#c7cfca] bg-surface"
              }
            />
            <div className="font-sans text-[13px] font-bold leading-[1.2] text-ink">{s.title}</div>
            <div className="mt-0.5 font-sans text-[11.5px] font-medium leading-[1.4] text-[#7e867f]">
              {s.note}
            </div>
          </div>
        ))}
      </div>

      {/* coach note */}
      <div className="flex items-start gap-2.5 rounded-[14px] border border-forecast-border bg-coach-surface px-3 py-3">
        <Sparkles className="mt-px size-[15px] flex-none fill-forecast text-forecast" />
        <span className="font-sans text-[12px] font-medium leading-[1.45] text-coach-text">
          Moved to the evening — you tend to skip morning workouts, and this fits your day better.
        </span>
      </div>
    </FlowScreen>
  );
}
