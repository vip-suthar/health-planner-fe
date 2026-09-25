"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import { BackHeader } from "@/components/chrome/back-header";
import { FlowScreen } from "@/components/chrome/flow-screen";
import { StatusBadge } from "@/components/np/status-badge";
import { cn } from "@/lib/utils";

interface SwapOption {
  id: string;
  title: string;
  note: string;
  pantry?: boolean;
  hatch: string;
  recommended?: boolean;
}

const OPTIONS: SwapOption[] = [
  {
    id: "o1",
    title: "Spinach & feta wrap",
    note: "Similar calories · more iron · uses your spinach",
    pantry: true,
    recommended: true,
    hatch: "repeating-linear-gradient(135deg,#ecf1ee,#ecf1ee 5px,#f5f8f6 5px,#f5f8f6 10px)",
  },
  {
    id: "o2",
    title: "Lentil & tomato soup",
    note: "−60 kcal · higher fiber · 15m prep",
    hatch: "repeating-linear-gradient(135deg,#eaf0f4,#eaf0f4 5px,#f3f7f9 5px,#f3f7f9 10px)",
  },
  {
    id: "o3",
    title: "Tofu poke bowl",
    note: "Same protein · needs 2 new items",
    hatch: "repeating-linear-gradient(135deg,#f0eee9,#f0eee9 5px,#f8f6f2 5px,#f8f6f2 10px)",
  },
];

export default function SwapMealPage() {
  const router = useRouter();
  const [selected, setSelected] = useState("o1");

  return (
    <FlowScreen
      header={<BackHeader title="Swap" />}
      footer={
        <button
          type="button"
          onClick={() => router.push("/log/meal/free")}
          className="flex h-12 w-full items-center justify-center rounded-[14px] border border-control-border bg-surface font-sans text-[13px] font-semibold text-text-strong active:scale-[0.99]"
        >
          Ate something else instead
        </button>
      }
    >
      <h1 className="font-sans text-[18px] font-bold leading-[1.2] text-ink">
        Swap your lunch
      </h1>
      <div className="mb-4 mt-2 flex items-center gap-1.5">
        <Shield className="size-3.5 text-brand" strokeWidth={2} />
        <span className="font-sans text-[12px] font-medium leading-[1.3] text-[#5a6671]">
          Every option is safe for you &amp; on-budget. Pantry items first.
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {OPTIONS.map((o) => {
          const active = selected === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => {
                setSelected(o.id);
                toast.success(`Swapped to ${o.title}`);
              }}
              className={cn(
                "flex items-center gap-3 rounded-[16px] border bg-surface p-3 text-left transition-all active:scale-[0.99]",
                active ? "border-[1.5px] border-brand-border shadow-card-soft" : "border-hairline",
              )}
            >
              <div className="size-[46px] flex-none rounded-[12px]" style={{ background: o.hatch }} />
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-sans text-[14px] font-bold leading-[1.2] text-ink">
                    {o.title}
                  </span>
                  {o.pantry && <StatusBadge tone="brand">PANTRY</StatusBadge>}
                </div>
                <div
                  className={cn(
                    "mt-1 font-sans text-[11px] font-medium leading-[1.3]",
                    o.recommended ? "text-brand" : "text-[#7e867f]",
                  )}
                >
                  {o.note}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </FlowScreen>
  );
}
