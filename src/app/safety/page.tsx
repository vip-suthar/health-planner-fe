"use client";

import { AlertTriangle, Info, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/chrome/app-shell";
import { BackHeader } from "@/components/chrome/back-header";
import { Eyebrow } from "@/components/np/typography";
import useSWR from "swr";
import { data as dataApi } from "@/lib/api";

export default function SafetyPage() {
  const { data: medical, isLoading: loading } = useSWR("/data/medical", () =>
    dataApi.getMedical(),
  );

  const items = medical ?? [];
  const allergens = items.filter((m) => m.type === "allergy");
  const conditions = items.filter((m) => m.type === "condition");
  const medications = items.filter((m) => m.type === "medication");

  return (
    <AppShell topBar={<BackHeader title="What we protect you from" />} fab={false}>
      {/* hero */}
      <div className="mb-4 flex items-center gap-3 rounded-[18px] bg-movement p-4">
        <div className="flex size-11 flex-none items-center justify-center rounded-[13px] bg-[#9fd8bc]/20 text-[#9fd8bc]">
          <ShieldCheck className="size-[22px]" strokeWidth={2} />
        </div>
        <div>
          <div className="font-sans text-[15px] font-bold leading-[1.2] text-white">
            Your plan respects all of this
          </div>
          <div className="mt-1 font-sans text-[11px] font-medium leading-[1.4] text-[#9fd8bc]">
            Unsafe items never appear — in plans, swaps, or coach.
          </div>
        </div>
      </div>

      {loading && (
        <div className="py-8 text-center font-sans text-[13px] font-medium text-text-inactive">
          Loading your safety profile…
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="rounded-2xl border border-hairline bg-surface px-3.5 py-6 text-center font-sans text-[13px] font-medium text-text-inactive">
          No safety items yet. Add allergies, conditions or medications in onboarding.
        </div>
      )}

      {/* allergens */}
      {allergens.length > 0 && (
        <>
          <Eyebrow className="mb-2.5 block tracking-[0.05em]">Allergen exclusions</Eyebrow>
          <div className="mb-3.5 overflow-hidden rounded-2xl border border-hairline bg-surface [&>*:not(:last-child)]:border-b [&>*]:border-[#eef1ef]">
            {allergens.map((a) => (
              <div key={a.id ?? a.name} className="flex items-center gap-2.5 px-3.5 py-3.5">
                <AlertTriangle className="size-[17px] text-[#9a3d38]" strokeWidth={2} />
                <span className="flex-1 font-sans text-[13.5px] font-semibold text-ink">
                  {a.name}
                </span>
                {a.notes && (
                  <span className="font-mono text-[10px] font-medium text-[#7e867f]">
                    {a.notes}
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* conditions */}
      {conditions.length > 0 && (
        <>
          <Eyebrow className="mb-2.5 block tracking-[0.05em]">Condition bounds</Eyebrow>
          <div className="mb-3.5 overflow-hidden rounded-2xl border border-hairline bg-surface [&>*:not(:last-child)]:border-b [&>*]:border-[#eef1ef]">
            {conditions.map((b) => (
              <div key={b.id ?? b.name} className="flex items-center gap-2.5 px-3.5 py-3.5">
                <span className="flex-1 font-sans text-[13.5px] font-semibold text-ink">
                  {b.name}
                </span>
                <span className="font-mono text-[11px] font-semibold text-brand">
                  {b.severity ? `${b.severity} severity` : "managed"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* medication review */}
      {medications.map((m) => (
        <div
          key={m.id ?? m.name}
          className="mb-2.5 flex gap-3 rounded-2xl border border-caution-border bg-[#f6efe3] p-3.5"
        >
          <Info className="mt-px size-[18px] flex-none text-[#8a5a12]" strokeWidth={2} />
          <div>
            <div className="font-sans text-[13px] font-bold leading-[1.3] text-[#6e4a12]">
              {m.name} — interaction flag
            </div>
            <div className="mt-1 font-sans text-[12px] font-medium leading-[1.45] text-[#8a6a2e]">
              A dietitian reviews plan changes that touch this. You&apos;ll be notified —
              your last safe plan stays usable meanwhile.
            </div>
          </div>
        </div>
      ))}
    </AppShell>
  );
}
