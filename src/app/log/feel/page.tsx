"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Sparkles } from "lucide-react";
import { BackHeader } from "@/components/chrome/back-header";
import { FlowScreen, FlowCTA } from "@/components/chrome/flow-screen";
import { ChoicePill } from "@/components/np/selectable";
import { Eyebrow } from "@/components/np/typography";
import { data as dataApi } from "@/lib/api";
import { cn } from "@/lib/utils";

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_");

const ENERGY = [
  { emoji: "😴", label: "Drained" },
  { emoji: "😕", label: "Low" },
  { emoji: "🙂", label: "Okay" },
  { emoji: "😃", label: "Good" },
  { emoji: "⚡", label: "Great" },
];

const SYMPTOMS = ["Afternoon slump", "Bloated", "Headache", "Hungry", "Cravings", "Well-rested"];

export default function FeelLogPage() {
  const router = useRouter();
  const [energy, setEnergy] = useState(2);
  const [symptoms, setSymptoms] = useState<string[]>(["Afternoon slump"]);
  const toggle = (s: string) =>
    setSymptoms((l) => (l.includes(s) ? l.filter((x) => x !== s) : [...l, s]));

  async function save() {
    const date = new Date().toISOString().slice(0, 10);
    const events = symptoms.length
      ? symptoms.map((s) => ({ metric: "issue" as const, value: 1, note: slug(s) }))
      : [{ metric: "energy" as const, value: energy + 1 }];
    try {
      await Promise.allSettled(
        events.map((data) =>
          dataApi.logIntake({
            eventId: dataApi.newEventId(),
            type: "wellness",
            date,
            data,
          }),
        ),
      );
      toast.success("Saved — coach will tune today");
    } catch {
      toast.error("Could not save — try again.");
    }
    router.back();
  }

  return (
    <FlowScreen
      header={<BackHeader title="How are you feeling?" />}
      footer={
        <FlowCTA onClick={save}>
          <Check className="size-4" strokeWidth={2.6} />
          Save
        </FlowCTA>
      }
    >
      <Eyebrow className="mb-3 block tracking-[0.05em]">Energy</Eyebrow>
      <div className="mb-5 flex justify-between">
        {ENERGY.map((e, i) => {
          const active = energy === i;
          return (
            <button key={e.label} onClick={() => setEnergy(i)} className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "flex size-[52px] items-center justify-center rounded-[15px] text-[22px]",
                  active ? "border-[1.5px] border-brand bg-brand-surface" : "border border-hairline bg-surface",
                )}
              >
                {e.emoji}
              </span>
              <span className={cn("font-sans text-[10px] font-medium", active ? "font-semibold text-brand" : "text-text-inactive")}>
                {e.label}
              </span>
            </button>
          );
        })}
      </div>

      <Eyebrow className="mb-3 block tracking-[0.05em]">
        Anything notable? <span className="text-[#c2cac5]">· optional</span>
      </Eyebrow>
      <div className="mb-4.5 flex flex-wrap gap-1.5">
        {SYMPTOMS.map((s) => (
          <ChoicePill key={s} label={s} selected={symptoms.includes(s)} onClick={() => toggle(s)} />
        ))}
      </div>

      <div className="flex items-center gap-2.5 rounded-[11px] border border-forecast-border bg-coach-surface px-3 py-2.5">
        <Sparkles className="size-3.5 flex-none fill-forecast text-forecast" />
        <span className="font-sans text-[11.5px] font-medium leading-[1.35] text-coach-text">
          Coach uses this to tune today&apos;s suggestions — e.g. steadier energy foods.
        </span>
      </div>
    </FlowScreen>
  );
}
