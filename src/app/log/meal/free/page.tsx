"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Check, PencilLine, Plus, Search } from "lucide-react";
import { BackHeader } from "@/components/chrome/back-header";
import { FlowScreen, FlowCTA } from "@/components/chrome/flow-screen";
import { Stepper } from "@/components/np/stepper";
import { Eyebrow } from "@/components/np/typography";
import { data as dataApi } from "@/lib/api";

export default function FreeLogPage() {
  const router = useRouter();
  const [query, setQuery] = useState("Pad thai");
  const [portion, setPortion] = useState(1);

  async function logIt() {
    try {
      await dataApi.logIntake({
        eventId: dataApi.newEventId(),
        type: "meal",
        data: { mealType: dataApi.mealTypeNow(), name: query },
      });
      toast.success("Logged — with a safety note");
      router.back();
    } catch {
      toast.error("Could not log — try again.");
    }
  }

  return (
    <FlowScreen
      header={<BackHeader title="Ate something else?" />}
      footer={
        <FlowCTA onClick={logIt}>
          <Check className="size-4" strokeWidth={2.6} />
          Log it anyway
        </FlowCTA>
      }
    >
      {/* search */}
      <div className="mb-4 flex h-12 items-center gap-2.5 rounded-[13px] border-[1.5px] border-brand bg-surface px-3.5 shadow-[0_0_0_3px_rgba(54,121,93,0.12)]">
        <Search className="size-[17px] text-brand" strokeWidth={1.9} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent font-sans text-[14px] font-medium text-ink outline-none"
        />
      </div>

      <Eyebrow className="mb-2.5 block tracking-[0.06em]">Results</Eyebrow>

      {/* flagged + selected result */}
      <div className="mb-2.5 rounded-[14px] border-[1.5px] border-brand-border bg-surface p-3">
        <div className="flex items-center gap-3">
          <div
            className="size-[42px] flex-none rounded-[11px]"
            style={{ background: "repeating-linear-gradient(135deg,#f0eee9,#f0eee9 5px,#f8f6f2 5px,#f8f6f2 10px)" }}
          />
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-sans text-[14px] font-bold leading-[1.2] text-ink">
                Pad Thai, chicken
              </span>
              <span className="flex items-center gap-1 rounded-[5px] border border-[#e2a9a5] bg-[#fbeeed] px-1.5 py-1 font-mono text-[9px] font-semibold text-[#9a3d38]">
                <AlertTriangle className="size-[9px]" strokeWidth={2.4} />
                PEANUT
              </span>
            </div>
            <div className="mt-1.5 font-mono text-[10px] font-medium text-[#7e867f]">
              ~640 kcal · est. · 1 plate
            </div>
          </div>
          <span className="flex size-[22px] flex-none items-center justify-center rounded-full bg-brand text-white">
            <Check className="size-3.5" strokeWidth={3} />
          </span>
        </div>

        {/* inline allergen warning */}
        <div className="mt-3 flex items-start gap-2.5 rounded-[11px] border border-[#e2a9a5] bg-[#fbeeed] px-3 py-2.5">
          <AlertTriangle className="mt-px size-[15px] flex-none text-[#9a3d38]" strokeWidth={2} />
          <div>
            <div className="font-sans text-[12px] font-bold leading-[1.3] text-[#9a3d38]">
              Contains peanut — flagged in your profile
            </div>
            <div className="mt-0.5 font-sans text-[11.5px] font-medium leading-[1.4] text-[#a85852]">
              It&apos;s your food to log — we just want you to know.
            </div>
          </div>
        </div>

        {/* portion */}
        <div className="mt-2.5 flex items-center justify-between rounded-[11px] bg-surface-muted px-3 py-2">
          <span className="font-sans text-[12px] font-semibold text-text-strong">Portion</span>
          <Stepper
            size="sm"
            value={`${portion} plate`}
            onChange={(d) => setPortion((p) => Math.max(1, p + d))}
          />
        </div>
      </div>

      {/* safe result */}
      <div className="mb-2.5 flex items-center gap-3 rounded-[14px] border border-hairline bg-surface px-3 py-3">
        <div
          className="size-[42px] flex-none rounded-[11px]"
          style={{ background: "repeating-linear-gradient(135deg,#ecf1ee,#ecf1ee 5px,#f5f8f6 5px,#f5f8f6 10px)" }}
        />
        <div className="flex-1">
          <div className="font-sans text-[14px] font-bold leading-[1.2] text-ink">
            Pad See Ew, veg
          </div>
          <div className="mt-1.5 font-mono text-[10px] font-medium text-[#7e867f]">
            ~520 kcal · est. · safe for you
          </div>
        </div>
        <span className="flex size-7 flex-none items-center justify-center rounded-[9px] border border-control-border text-brand">
          <Plus className="size-3.5" strokeWidth={2.4} />
        </span>
      </div>

      {/* add manually */}
      <button
        type="button"
        onClick={() => router.push("/log/meal/manual")}
        className="flex h-[46px] w-full items-center gap-2.5 rounded-[13px] border border-dashed border-[#c2cac5] bg-surface px-3.5 text-[#7e867f] active:scale-[0.99]"
      >
        <PencilLine className="size-4" strokeWidth={2} />
        <span className="font-sans text-[13px] font-semibold">
          Add &ldquo;{query}&rdquo; manually
        </span>
      </button>
    </FlowScreen>
  );
}
