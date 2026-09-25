"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ChevronLeft, Heart, Shield, Sparkles } from "lucide-react";

const META = [
  { value: "18m", label: "PREP" },
  { value: "540", label: "KCAL" },
  { value: "Easy", label: "SKILL" },
];

const MACROS = [
  { v: "32g", l: "PROT", c: "text-brand" },
  { v: "58g", l: "CARB", c: "text-forecast" },
  { v: "19g", l: "FAT", c: "text-caution" },
  { v: "11g", l: "FIBER", c: "text-text-strong" },
];

const INGREDIENTS = [
  { name: "Chickpeas", qty: "1 can", have: true },
  { name: "Baby spinach", qty: "2 handfuls", have: true },
  { name: "Bulgur wheat", qty: "80 g", have: true },
  { name: "Lemon", qty: "TO BUY", have: false },
];

const STEPS = [
  "Cook the bulgur in simmering water for 12 minutes, then drain.",
  "Toss with chickpeas, spinach, lemon juice, olive oil, salt & pepper.",
  "Finish with a little zest and serve warm or cold.",
];

export default function RecipePage() {
  const router = useRouter();

  return (
    <div className="relative mx-auto flex h-[100dvh] w-full max-w-[440px] flex-col bg-app-bg">
      {/* hero */}
      <div className="relative">
        <div
          className="flex h-[172px] items-end p-3"
          style={{ background: "repeating-linear-gradient(135deg,#e6eee9,#e6eee9 8px,#f1f6f3 8px,#f1f6f3 16px)" }}
        >
          <span className="rounded-md bg-white/85 px-2 py-1.5 font-mono text-[9px] font-semibold text-[#7e9a88]">
            MEAL PHOTO
          </span>
        </div>
        <div className="absolute inset-x-3.5 top-3.5 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="flex size-9 items-center justify-center rounded-[11px] bg-white/90 text-ink backdrop-blur active:scale-95"
          >
            <ChevronLeft className="size-[18px]" strokeWidth={2} />
          </button>
          <button
            aria-label="Save"
            className="flex size-9 items-center justify-center rounded-[11px] bg-white/90 text-ink backdrop-blur active:scale-95"
          >
            <Heart className="size-[17px]" strokeWidth={1.9} />
          </button>
        </div>
      </div>

      {/* content */}
      <div className="no-scrollbar flex-1 overflow-y-auto p-4">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[10px] font-medium tracking-[0.04em] text-text-muted">
            12:30 · LUNCH
          </span>
          <span className="rounded-md border border-brand-border bg-brand-surface px-1.5 py-1 font-mono text-[9px] font-semibold text-brand-deep">
            FROM PANTRY
          </span>
          <span className="flex items-center gap-1 rounded-md border border-brand-border bg-brand-surface px-1.5 py-1 font-mono text-[9px] font-semibold text-brand-deep">
            <Shield className="size-2.5" strokeWidth={2.2} />
            SAFE
          </span>
        </div>
        <h1 className="font-sans text-[20px] font-extrabold leading-[1.2] tracking-[-0.01em] text-ink">
          Lemon chickpea grain bowl
        </h1>
        <p className="mt-1.5 font-sans text-[12.5px] font-medium leading-[1.5] text-[#7e867f]">
          Bright, filling, and high in plant protein — assembled entirely from what&apos;s already
          in your kitchen.
        </p>

        {/* meta tiles */}
        <div className="my-3.5 flex gap-2">
          {META.map((m) => (
            <div key={m.label} className="flex-1 rounded-xl border border-hairline bg-surface p-2.5 text-center">
              <div className="font-sans text-[15px] font-bold text-ink">{m.value}</div>
              <div className="mt-1 font-mono text-[9px] font-medium text-text-muted">{m.label}</div>
            </div>
          ))}
        </div>

        {/* macro row */}
        <div className="mb-4 flex gap-3.5 rounded-xl border border-hairline bg-surface px-3.5 py-3">
          {MACROS.map((m) => (
            <div key={m.l}>
              <span className={`font-sans text-[14px] font-bold ${m.c}`}>{m.v}</span>{" "}
              <span className="font-mono text-[10px] font-medium text-text-muted">{m.l}</span>
            </div>
          ))}
        </div>

        {/* ingredients */}
        <div className="mb-2.5 flex items-center justify-between">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted">
            Ingredients · 1 serving
          </span>
          <span className="font-sans text-[11px] font-semibold text-brand">3 in pantry · 1 to buy</span>
        </div>
        <div className="mb-4 overflow-hidden rounded-[14px] border border-hairline bg-surface [&>*:not(:last-child)]:border-b [&>*]:border-[#eef1ef]">
          {INGREDIENTS.map((ing) => (
            <div key={ing.name} className="flex items-center gap-2.5 px-3.5 py-3">
              {ing.have ? (
                <span className="flex size-5 items-center justify-center rounded-md bg-brand text-white">
                  <Check className="size-3" strokeWidth={3} />
                </span>
              ) : (
                <span className="size-5 rounded-md border-[1.5px] border-[#c2cac5]" />
              )}
              <span className="flex-1 font-sans text-[13px] font-semibold text-ink">{ing.name}</span>
              {ing.have ? (
                <span className="font-mono text-[11px] font-medium text-[#7e867f]">{ing.qty}</span>
              ) : (
                <span className="rounded-[5px] bg-[#f6efe3] px-1.5 py-1 font-mono text-[9px] font-semibold text-[#8a5a12]">
                  {ing.qty}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* method */}
        <div className="mb-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted">
          Method
        </div>
        <div className="mb-4 flex flex-col gap-3">
          {STEPS.map((s, i) => (
            <div key={i} className="flex gap-2.5">
              <span className="flex size-[22px] flex-none items-center justify-center rounded-full bg-brand-surface font-sans text-[11px] font-bold text-brand">
                {i + 1}
              </span>
              <span className="font-sans text-[12.5px] font-medium leading-[1.45] text-text-strong">
                {s}
              </span>
            </div>
          ))}
        </div>

        {/* coach note */}
        <div className="flex items-start gap-2.5 rounded-[14px] border border-forecast-border bg-coach-surface px-3 py-3">
          <Sparkles className="mt-px size-[15px] flex-none fill-forecast text-forecast" />
          <span className="font-sans text-[12px] font-medium leading-[1.45] text-coach-text">
            Picked for today because your protein is running a little low.
          </span>
        </div>
      </div>

      {/* sticky commit */}
      <div
        className="flex gap-2.5 border-t border-hairline bg-surface px-4 pt-3"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom),12px)" }}
      >
        <button
          onClick={() => toast.success("Logged — 480 kcal left today")}
          className="flex h-[50px] flex-1 items-center justify-center gap-1.5 rounded-[15px] bg-brand font-sans text-[14px] font-bold text-white active:scale-[0.99]"
        >
          <Check className="size-4" strokeWidth={2.6} />
          Log it
        </button>
        <button
          onClick={() => router.push("/log/meal")}
          className="flex h-[50px] items-center rounded-[15px] border border-control-border bg-surface px-[18px] font-sans text-[14px] font-semibold text-text-strong active:scale-[0.99]"
        >
          Swap
        </button>
      </div>
    </div>
  );
}
