"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Sparkles, TrendingDown } from "lucide-react";
import { BackHeader } from "@/components/chrome/back-header";
import { FlowScreen, FlowCTA } from "@/components/chrome/flow-screen";
import { data as dataApi } from "@/lib/api";
import { cn } from "@/lib/utils";

const TICKS = [14, 22, 14, 14, 14, 30, 14, 14, 14, 22, 14];

export default function WeightLogPage() {
  const router = useRouter();
  const [value] = useState("76.1");

  async function save() {
    try {
      await dataApi.logIntake({
        eventId: dataApi.newEventId(),
        type: "wellness",
        // `weight` is outside the spec's wellness metric enum — see
        // WellnessMetric in lib/api/data.ts. Expect a 422 until the backend
        // adds it; the error is surfaced rather than swallowed.
        data: { metric: "weight", value: Number(value), unit: "kg" },
      });
      toast.success("Weigh-in saved");
    } catch {
      toast.error("Could not save your weigh-in — try again.");
    }
    router.back();
  }

  return (
    <FlowScreen
      header={<BackHeader title="Log your weight" />}
      footer={
        <FlowCTA onClick={save}>
          <Check className="size-4" strokeWidth={2.6} />
          Save weigh-in
        </FlowCTA>
      }
    >
      <p className="mb-5 font-sans text-[12.5px] font-medium text-[#7e867f]">
        Last logged 76.3 kg · 3 days ago
      </p>

      <div className="mb-4.5 text-center">
        <div className="flex items-baseline justify-center gap-1.5">
          <span className="font-sans text-[52px] font-extrabold leading-none tracking-[-0.02em] text-ink">
            {value}
          </span>
          <span className="font-sans text-[18px] font-semibold text-[#7e867f]">kg</span>
        </div>
        <div className="mt-2 flex items-center justify-center gap-1.5 text-brand">
          <TrendingDown className="size-3.5" strokeWidth={2.4} />
          <span className="font-sans text-[12.5px] font-semibold">0.2 kg since last time</span>
        </div>
      </div>

      {/* ruler */}
      <div className="relative mb-2 flex h-14 items-end justify-center gap-[7px] overflow-hidden rounded-[14px] border border-hairline bg-surface pb-2">
        {TICKS.map((h, i) => (
          <span
            key={i}
            className={cn("w-[1.5px]", h === 30 ? "w-[2.5px] bg-brand" : h === 22 ? "bg-[#c2cac5]" : "bg-[#d3d9d5]")}
            style={{ height: h }}
          />
        ))}
        <div className="absolute left-1/2 top-2 size-0 -translate-x-1/2 border-x-[5px] border-t-[6px] border-x-transparent border-t-brand" />
      </div>
      <p className="mb-4.5 text-center font-sans text-[11px] font-medium text-text-inactive">
        Drag to fine-tune · or type a value
      </p>

      <div className="flex items-center gap-2.5 rounded-[11px] border border-forecast-border bg-coach-surface px-3 py-2.5">
        <Sparkles className="size-3.5 flex-none fill-forecast text-forecast" />
        <span className="font-sans text-[11.5px] font-medium leading-[1.35] text-coach-text">
          Daily fluctuations are normal — we read the trend, not the single number.
        </span>
      </div>
    </FlowScreen>
  );
}
