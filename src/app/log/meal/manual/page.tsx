"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, ChevronDown, Plus, Sparkles, X } from "lucide-react";
import { BackHeader } from "@/components/chrome/back-header";
import { FlowScreen, FlowCTA } from "@/components/chrome/flow-screen";
import { useRouter } from "next/navigation";
import { Stepper } from "@/components/np/stepper";
import { Eyebrow } from "@/components/np/typography";
import { data as dataApi } from "@/lib/api";
import { cn } from "@/lib/utils";

const COMPLETENESS = [
  { key: "all", label: "All of it", hint: "PRECISE" },
  { key: "some", label: "Some", hint: "ROUGH" },
  { key: "none", label: "None", hint: "FROM NAME" },
];

const MACROS = [
  { label: "PROTEIN", value: 22, color: "text-brand" },
  { label: "CARBS", value: 48, color: "text-forecast" },
  { label: "FAT", value: 11, color: "text-caution" },
];

export default function ManualEntryPage() {
  const router = useRouter();
  const [completeness, setCompleteness] = useState("all");
  const [flags] = useState(["Peanut", "Shellfish"]);
  const [flag, setFlag] = useState("none");
  const [portion, setPortion] = useState(1);
  const [name, setName] = useState("Grandma's lentil stew");
  const [ingredients, setIngredients] = useState([
    "Red lentils",
    "Carrot",
    "Onion",
    "Olive oil",
  ]);

  async function logMeal() {
    try {
      await dataApi.logIntake({
        eventId: dataApi.newEventId(),
        type: "meal",
        data: {
          mealType: "dinner",
          name: name.trim() || "Meal",
          ingredients,
          quantity: { value: portion, unit: "bowl" },
        },
      });
      toast.success("Meal logged");
      router.back();
    } catch {
      toast.error("Could not log meal — try again.");
    }
  }

  return (
    <FlowScreen
      header={<BackHeader title="Add manually" />}
      footer={
        <FlowCTA onClick={logMeal}>
          <Check className="size-4" strokeWidth={2.6} />
          Log this meal
        </FlowCTA>
      }
    >
      <p className="mb-3.5 font-sans text-[12.5px] font-medium leading-[1.45] text-[#7e867f]">
        Tell us what you can. We&apos;ll estimate the rest — you can refine anytime.
      </p>

      {/* name */}
      <Eyebrow className="mb-2 block tracking-[0.05em]">What did you eat?</Eyebrow>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mb-4 h-12 w-full rounded-[13px] border-[1.5px] border-brand bg-surface px-3.5 font-sans text-[14px] font-medium text-ink shadow-[0_0_0_3px_rgba(54,121,93,0.12)] outline-none"
      />

      {/* meal + portion */}
      <div className="mb-4 flex gap-2.5">
        <div className="flex-1">
          <Eyebrow className="mb-2 block tracking-[0.05em]">Meal</Eyebrow>
          <button className="flex h-[46px] w-full items-center justify-between rounded-xl border border-control-border bg-surface px-3.5">
            <span className="font-sans text-[13px] font-semibold text-ink">Dinner</span>
            <ChevronDown className="size-[15px] text-text-inactive" strokeWidth={2.2} />
          </button>
        </div>
        <div className="flex-1">
          <Eyebrow className="mb-2 block tracking-[0.05em]">Portion</Eyebrow>
          <div className="flex h-[46px] items-center justify-between rounded-xl border border-control-border bg-surface px-2.5">
            <Stepper
              size="sm"
              value={`${portion} bowl`}
              onChange={(d) => setPortion((p) => Math.max(1, p + d))}
            />
          </div>
        </div>
      </div>

      {/* ingredients */}
      <div className="mb-2 flex items-center justify-between">
        <Eyebrow className="tracking-[0.05em]">Ingredients</Eyebrow>
        <span className="font-sans text-[11px] font-medium text-[#7e867f]">
          helps us estimate
        </span>
      </div>
      <div className="mb-4 rounded-[13px] border border-control-border bg-surface px-3 py-2.5">
        <div className="flex flex-wrap gap-1.5">
          {ingredients.map((ing) => (
            <span
              key={ing}
              className="flex items-center gap-1.5 rounded-lg bg-surface-muted px-2.5 py-2 font-sans text-[12px] font-semibold text-text-strong"
            >
              {ing}
              <button
                onClick={() => setIngredients((l) => l.filter((x) => x !== ing))}
                aria-label={`Remove ${ing}`}
              >
                <X className="size-3 text-text-inactive" strokeWidth={2.4} />
              </button>
            </span>
          ))}
        </div>
        <button className="mt-2 flex w-full items-center gap-2 border-t border-[#eef1ef] pt-2.5 text-brand">
          <Plus className="size-[15px]" strokeWidth={2.2} />
          <span className="font-sans text-[13px] font-semibold">Add ingredient</span>
        </button>
      </div>

      {/* completeness */}
      <p className="mb-2 font-sans text-[11.5px] font-medium leading-[1.4] text-[#7e867f]">
        How complete is this list? It sets how confident our estimate is.
      </p>
      <div className="mb-2 flex gap-1.5">
        {COMPLETENESS.map((c) => {
          const active = completeness === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setCompleteness(c.key)}
              className={cn(
                "flex-1 rounded-[11px] py-2.5 text-center",
                active
                  ? "border-[1.5px] border-brand bg-brand-surface"
                  : "border border-control-border bg-surface",
              )}
            >
              <div className={cn("font-sans text-[13px] font-bold", active ? "text-movement" : "text-ink")}>
                {c.label}
              </div>
              <div className={cn("mt-1 font-mono text-[9px] font-medium", active ? "text-brand" : "text-text-muted")}>
                {c.hint}
              </div>
            </button>
          );
        })}
      </div>
      {completeness === "all" && (
        <div className="mb-4 flex items-center gap-1.5 rounded-[10px] border border-brand-border bg-brand-surface px-3 py-2">
          <Check className="size-3 flex-none text-brand" strokeWidth={2.2} />
          <span className="font-sans text-[11.5px] font-medium leading-[1.35] text-brand-deep">
            Full ingredients given — estimate is high-confidence.
          </span>
        </div>
      )}

      {/* calories */}
      <div className="mb-2 flex items-center justify-between">
        <Eyebrow className="tracking-[0.05em]">Calories</Eyebrow>
        <span className="flex items-center gap-1 rounded-[7px] border border-forecast-border bg-coach-surface px-2 py-1.5 font-sans text-[10px] font-semibold text-forecast">
          <Sparkles className="size-[11px] fill-forecast" />
          From ingredients
        </span>
      </div>
      <div className="mb-4 flex h-12 items-center gap-2.5 rounded-[13px] border border-control-border bg-surface px-3.5">
        <span className="font-sans text-[17px] font-bold text-ink">420</span>
        <span className="font-sans text-[12px] font-medium text-[#7e867f]">kcal</span>
        <span className="flex-1" />
        <span className="font-sans text-[11px] font-medium text-text-inactive">
          edit if you know better
        </span>
      </div>

      {/* macros */}
      <Eyebrow className="mb-2.5 block tracking-[0.05em]">
        Macros <span className="text-[#c2cac5]">· optional</span>
      </Eyebrow>
      <div className="mb-4 flex gap-2">
        {MACROS.map((m) => (
          <div key={m.label} className="flex-1 rounded-xl border border-control-border bg-surface px-3 py-2.5">
            <div className="font-mono text-[9px] font-medium text-text-muted">{m.label}</div>
            <div className={cn("mt-1.5 font-sans text-[15px] font-bold", m.color)}>
              {m.value}
              <span className="font-sans text-[10px] font-medium text-[#7e867f]">g</span>
            </div>
          </div>
        ))}
      </div>

      {/* allergen flags */}
      <Eyebrow className="mb-2.5 block tracking-[0.05em]">
        Does it contain any of your flags?
      </Eyebrow>
      <div className="mb-1.5 flex flex-wrap gap-1.5">
        {flags.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFlag(f)}
            className={cn(
              "rounded-full border px-3.5 py-2 font-sans text-[12px] font-semibold",
              flag === f
                ? "border-[1.5px] border-brand-border bg-brand-surface text-brand"
                : "border-control-border bg-surface text-text-strong",
            )}
          >
            {f}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setFlag("none")}
          className={cn(
            "rounded-full border px-3.5 py-2 font-sans text-[12px] font-bold",
            flag === "none"
              ? "border-[1.5px] border-brand-border bg-brand-surface text-brand"
              : "border-control-border bg-surface text-text-strong",
          )}
        >
          None of these
        </button>
      </div>
      <p className="px-0.5 pb-2 font-sans text-[11px] font-medium leading-[1.4] text-text-inactive">
        This only affects your safety record — it never changes what you&apos;re logging.
      </p>
    </FlowScreen>
  );
}
