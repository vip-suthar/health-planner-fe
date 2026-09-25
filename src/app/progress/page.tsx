import { AppShell } from "@/components/chrome/app-shell";
import { TitleTopBar } from "@/components/chrome/top-bar";
import { StatBar } from "@/components/np/stat-bar";
import { Eyebrow } from "@/components/np/typography";
import { RichText } from "@/components/np/rich-text";
import {
  adaptationLog,
  adherence,
  adherenceNote,
  nutrientBalance,
  nutrientNote,
  trajectory,
} from "@/lib/data";

export default function ProgressPage() {
  return (
    <AppShell topBar={<TitleTopBar title="Progress" />}>
      {/* trajectory */}
      <section className="mb-3.5 rounded-[18px] border border-hairline bg-surface p-4">
        <div className="mb-1 font-mono text-[11px] font-medium tracking-[0.05em] text-text-muted">
          {trajectory.caption}
        </div>
        <div className="mb-3 font-sans text-[16px] font-bold leading-[1.3] text-ink">
          3 weeks in — trending to goal by{" "}
          <span className="text-brand">mid-August</span>
        </div>
        <svg width="100%" height="96" viewBox="0 0 320 96" preserveAspectRatio="none">
          <line x1="0" y1="20" x2="320" y2="74" stroke="var(--np-forecast-dashed)" strokeWidth="1.5" strokeDasharray="4 4" />
          <polyline points={trajectory.line} fill="none" stroke="var(--np-brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={trajectory.marker.x} cy={trajectory.marker.y} r="4" fill="var(--np-brand)" />
        </svg>
        <div className="mt-2 flex justify-between font-mono text-[10px] font-medium">
          <span className="text-text-inactive">{trajectory.start}</span>
          <span className="text-brand">{trajectory.now}</span>
          <span className="text-text-inactive">{trajectory.goal}</span>
        </div>
      </section>

      {/* adherence */}
      <section className="mb-3.5 rounded-[18px] border border-hairline bg-surface p-4">
        <Eyebrow className="mb-3 block tracking-[0.05em]">Adherence · last 2 weeks</Eyebrow>
        <div className="flex flex-col gap-3">
          {adherence.map((s) => (
            <StatBar key={s.label} stat={s} />
          ))}
        </div>
        <p className="mt-3 rounded-[11px] bg-surface-muted px-3 py-2.5 font-sans text-[12px] font-medium leading-[1.45] text-[#5a6671]">
          <RichText text={adherenceNote} />
        </p>
      </section>

      {/* nutrient balance */}
      <section className="mb-3.5 rounded-[18px] border border-hairline bg-surface p-4">
        <Eyebrow className="mb-3 block tracking-[0.05em]">Nutrient balance · rolling</Eyebrow>
        <div className="flex flex-col gap-2.5">
          {nutrientBalance.map((s) => (
            <StatBar key={s.label} stat={s} inline />
          ))}
        </div>
        <p className="mt-3 font-sans text-[11.5px] font-medium leading-[1.4] text-[#7e867f]">
          {nutrientNote}
        </p>
      </section>

      {/* adaptation log */}
      <Eyebrow className="mb-2.5 block tracking-[0.07em]">Why your plan changed</Eyebrow>
      <div className="relative pl-[22px]">
        <div className="absolute left-[5px] top-1.5 bottom-1.5 w-0.5 bg-control-border" />
        {adaptationLog.map((entry) => (
          <div key={entry.title} className="relative mb-3 last:mb-0">
            <div className="absolute -left-[22px] top-[3px] size-[11px] rounded-full border-2 border-surface bg-brand" />
            <div className="font-sans text-[12.5px] font-semibold leading-[1.35] text-[#2a332e]">
              {entry.title}
            </div>
            <div className="mt-0.5 font-sans text-[11px] font-medium leading-[1.3] text-[#7e867f]">
              {entry.note}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
