"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Droplet, Minus, Plus } from "lucide-react";
import { BackHeader } from "@/components/chrome/back-header";
import { FlowScreen } from "@/components/chrome/flow-screen";
import { data as dataApi } from "@/lib/api";
import { cn } from "@/lib/utils";

const GOAL = 8;

export default function WaterLogPage() {
  const router = useRouter();
  const [filled, setFilled] = useState(4);
  const [add, setAdd] = useState(1);

  async function save() {
    setFilled((f) => Math.min(GOAL, f + add));
    try {
      await dataApi.logIntake({
        eventId: dataApi.newEventId(),
        type: "wellness",
        data: { metric: "water", value: add, unit: "glass" },
      });
      toast.success(`Added ${add} glass${add > 1 ? "es" : ""}`);
    } catch {
      toast.error("Could not save — try again.");
    }
    router.back();
  }

  return (
    <FlowScreen
      header={<BackHeader title="Log water" />}
      footer={
        <button
          onClick={save}
          className="flex h-[50px] w-full items-center justify-center gap-1.5 rounded-[15px] bg-forecast font-sans text-[15px] font-bold text-white active:scale-[0.99]"
        >
          <Check className="size-4" strokeWidth={2.6} />
          Add {add} glass{add > 1 ? "es" : ""}
        </button>
      }
    >
      <div className="mb-4.5 flex items-center gap-3">
        <div className="flex size-11 flex-none items-center justify-center rounded-[13px] bg-forecast-surface text-forecast">
          <Droplet className="size-[22px]" strokeWidth={1.8} />
        </div>
        <div>
          <div className="font-sans text-[18px] font-bold leading-[1.2] text-ink">Log water</div>
          <div className="mt-0.5 font-sans text-[12px] font-medium text-[#7e867f]">
            {filled} of {GOAL} glasses today
          </div>
        </div>
      </div>

      <div className="mb-5 flex gap-1.5">
        {Array.from({ length: GOAL }).map((_, i) => (
          <span
            key={i}
            className={cn("h-9 flex-1 rounded-[9px]", i < filled ? "bg-forecast" : "bg-[#e0e6ec]")}
          />
        ))}
      </div>

      {/* big stepper */}
      <div className="mb-5 flex items-center justify-center gap-6">
        <button
          onClick={() => setAdd((a) => Math.max(1, a - 1))}
          aria-label="Less"
          className="flex size-[54px] items-center justify-center rounded-[16px] border border-control-border bg-surface text-text-strong active:scale-95"
        >
          <Minus className="size-[22px]" strokeWidth={2.4} />
        </button>
        <div className="text-center">
          <div className="font-sans text-[34px] font-bold leading-none text-ink">{add}</div>
          <div className="mt-1.5 font-mono text-[11px] font-medium text-text-muted">GLASS · 250ml</div>
        </div>
        <button
          onClick={() => setAdd((a) => a + 1)}
          aria-label="More"
          className="flex size-[54px] items-center justify-center rounded-[16px] bg-forecast text-white active:scale-95"
        >
          <Plus className="size-[22px]" strokeWidth={2.4} />
        </button>
      </div>

      <div className="flex gap-2">
        {["+ Glass", "+ Bottle", "+ Cup"].map((p) => (
          <button
            key={p}
            onClick={() => setAdd((a) => a + 1)}
            className="flex-1 rounded-[11px] border border-control-border bg-surface py-2.5 font-sans text-[13px] font-semibold text-text-strong active:scale-[0.98]"
          >
            {p}
          </button>
        ))}
      </div>
    </FlowScreen>
  );
}
