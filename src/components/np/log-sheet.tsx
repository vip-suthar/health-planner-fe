"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { Check, PencilLine, Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FlowCTA } from "@/components/chrome/flow-screen";
import { ChoicePill } from "./selectable";
import { Segmented } from "./segmented";
import { Stepper } from "./stepper";
import { Eyebrow } from "./typography";
import type { TimelineItem } from "@/lib/data";
import { data as dataApi } from "@/lib/api";
import type { IntakeEvent, MealType } from "@/lib/api/data";
import { cn } from "@/lib/utils";

type TaskKind = "meal" | "activity";
type Mode = "log" | "skip" | "custom";
type Status = "done" | "skipped";

/**
 * What the sheet is open for. Plan tasks log/skip/replace `item`; without an
 * `item`, `custom` is a standalone meal/activity entry. Pass a stable object
 * (state or a module constant) — the sheet keys off its identity.
 */
export type LogTarget =
  | { kind: TaskKind; mode: Mode; item?: TimelineItem }
  | { kind: "water" | "weight" | "feel" };

const RATINGS = [
  { emoji: "😖", label: "Awful" },
  { emoji: "😕", label: "Meh" },
  { emoji: "🙂", label: "Okay" },
  { emoji: "😃", label: "Good" },
  { emoji: "😍", label: "Loved it" },
];

const SKIP_REASONS: Record<TaskKind, string[]> = {
  meal: ["Not hungry", "No time", "Didn't fancy it", "Missing ingredients", "Ate out"],
  activity: ["No time", "Too tired", "Sore or unwell", "Weather", "Not in the mood"],
};

const ENERGY = [
  { emoji: "😴", label: "Drained" },
  { emoji: "😕", label: "Low" },
  { emoji: "🙂", label: "Okay" },
  { emoji: "😃", label: "Good" },
  { emoji: "⚡", label: "Great" },
];

const SYMPTOMS = ["Afternoon slump", "Bloated", "Headache", "Hungry", "Cravings", "Well-rested"];

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "snack", "dinner"];
const DIFFICULTIES = ["easy", "medium", "hard"] as const;

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_");
const inputClass =
  "h-12 w-full rounded-[13px] border border-control-border bg-surface px-3.5 font-sans text-[14px] font-medium text-ink outline-none focus:border-brand";
const secondaryClass =
  "flex h-12 w-full items-center justify-center gap-2 rounded-[14px] border border-control-border bg-surface font-sans text-[13px] font-semibold text-text-strong active:scale-[0.99]";
const rowClass = "flex items-center justify-between rounded-[11px] bg-surface-muted px-3 py-2";
const rowLabelClass = "font-sans text-[12px] font-semibold text-text-strong";

/** Real plan items carry `meal-<refId>` / `activity-<refId>`; mock fallbacks carry an index. */
const planRef = (item?: TimelineItem) =>
  item && /^(meal|activity)-(?!\d+$)/.test(item.id) ? item.id : undefined;

/**
 * The single bottom sheet for every log: plan tasks (log / skip / replace),
 * custom meals & activities, water, weight, and how-I-feel. Rating / review
 * ride on the one intake request (the API has no update route).
 */
export function LogSheet({
  target,
  onClose,
  onLogged,
}: {
  target: LogTarget | null;
  onClose: () => void;
  onLogged?: (status: Status, item?: TimelineItem) => void;
}) {
  const { mutate } = useSWRConfig();
  // Keep the last target so content stays put during the close animation.
  const [shown, setShown] = useState(target);
  if (target && target !== shown) setShown(target);

  function done(status: Status) {
    onLogged?.(status, shown && "item" in shown ? shown.item : undefined);
    mutate("/data/ledger/today");
    onClose();
  }

  return (
    <Sheet open={!!target} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[90dvh] max-w-110 gap-0 rounded-t-[24px] border-hairline pb-[max(env(safe-area-inset-bottom),16px)]"
      >
        {shown?.kind === "water" ? (
          <WaterBody onDone={done} />
        ) : shown?.kind === "weight" ? (
          <WeightBody onDone={done} />
        ) : shown?.kind === "feel" ? (
          <FeelBody onDone={done} />
        ) : (
          shown && "mode" in shown && <TaskBody target={shown} onDone={done} />
        )}
      </SheetContent>
    </Sheet>
  );
}

/** Shared title / scroll body / CTA footer. `onSubmit` throwing shows the error toast. */
function Frame({
  title,
  cta,
  onSubmit,
  secondary,
  children,
}: {
  title: string;
  cta: React.ReactNode;
  onSubmit: () => Promise<void>;
  secondary?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await onSubmit();
    } catch {
      toast.error("Could not save that — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <SheetHeader className="pb-1 pr-12">
        <SheetTitle className="font-sans text-[18px] font-extrabold leading-tight tracking-[-0.01em] text-ink">
          {title}
        </SheetTitle>
      </SheetHeader>
      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pt-2">{children}</div>
      <div className="flex flex-col gap-2 px-4 pt-1">
        <FlowCTA onClick={busy ? undefined : submit} className={cn(busy && "opacity-60")}>
          <Check className="size-4" strokeWidth={2.6} />
          {cta}
        </FlowCTA>
        {secondary}
      </div>
    </>
  );
}

function Optional() {
  return <span className="text-text-inactive">· optional</span>;
}

/** Row of 5 emoji tiles; `value` is the 0-based index, `null` = none picked. */
function EmojiScale({
  options,
  value,
  onChange,
}: {
  options: { emoji: string; label: string }[];
  value: number | null;
  onChange: (i: number | null) => void;
}) {
  return (
    <div className="mb-5 flex justify-between">
      {options.map((o, i) => {
        const active = value === i;
        return (
          <button
            key={o.label}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? null : i)}
            className="flex flex-col items-center gap-1.5"
          >
            <span
              className={cn(
                "flex size-13 items-center justify-center rounded-[15px] text-[22px]",
                active ? "border-[1.5px] border-brand bg-brand-surface" : "border border-hairline bg-surface",
              )}
            >
              {o.emoji}
            </span>
            <span
              className={cn(
                "font-sans text-[10px] font-medium",
                active ? "font-semibold text-brand" : "text-text-inactive",
              )}
            >
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function CoachNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-center gap-2.5 rounded-[11px] border border-forecast-border bg-coach-surface px-3 py-2.5">
      <Sparkles className="size-3.5 flex-none fill-forecast text-forecast" />
      <span className="font-sans text-[11.5px] font-medium leading-[1.35] text-coach-text">
        {children}
      </span>
    </div>
  );
}

/* ---------- meal / activity ---------- */

function TaskBody({
  target,
  onDone,
}: {
  target: { kind: TaskKind; mode: Mode; item?: TimelineItem };
  onDone: (status: Status) => void;
}) {
  const { kind, item } = target;
  const [mode, setMode] = useState(target.mode);
  const [rating, setRating] = useState<number | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  // custom entry
  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [portion, setPortion] = useState(1);
  const [minutes, setMinutes] = useState(30);
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>("easy");
  // One id per sheet open — a retry after a failed request stays idempotent.
  const [eventId] = useState(() => dataApi.newEventId());

  const refTaskId = planRef(item);
  const title = item?.title ?? (kind === "meal" ? "a meal" : "an activity");

  function planEvent(ref: string): IntakeEvent {
    const fields =
      mode === "skip"
        ? { isSkipped: true, review: reason ?? undefined }
        : { rating: rating === null ? undefined : rating + 1 };
    return kind === "activity"
      ? { eventId, type: "activity", isCustom: false, refTaskId: ref, ...fields }
      : { eventId, type: "meal", isCustom: false, refTaskId: ref, ...fields };
  }

  function customEvent(entryName: string): IntakeEvent {
    if (kind === "activity") {
      return {
        eventId,
        type: "activity",
        isCustom: true,
        duration: { value: minutes, unit: "min" },
        data: { name: entryName, difficulty, refTaskId },
      };
    }
    const slot = item?.label.toLowerCase() as MealType | undefined;
    const list = ingredients.split(",").map((s) => s.trim()).filter(Boolean);
    return {
      eventId,
      type: "meal",
      isCustom: true,
      quantity: { value: portion, unit: "bowl" }, // no plain "serving" unit; value is the multiplier
      data: {
        mealType: slot && MEAL_TYPES.includes(slot) ? slot : dataApi.mealTypeNow(),
        name: entryName,
        ingredients: list.length ? list : undefined,
        refTaskId,
      },
    };
  }

  async function submit() {
    if (mode === "custom" && !name.trim()) {
      toast.error(kind === "meal" ? "What did you eat?" : "What did you do?");
      return;
    }
    // Mock fallback items have no plan ref: a log is recorded as a custom entry
    // by title; a skip has nothing server-side to mark.
    const event =
      mode === "custom"
        ? customEvent(name.trim())
        : refTaskId
          ? planEvent(refTaskId)
          : mode === "log"
            ? customEvent(title)
            : null;
    if (event) await dataApi.logIntake(event);
    toast.success(
      mode === "skip" ? "Skipped — thanks for telling us" : `Logged ${mode === "custom" ? name.trim() : title}`,
    );
    onDone(mode === "skip" ? "skipped" : "done");
  }

  return (
    <Frame
      title={
        mode === "log"
          ? `Log ${title}`
          : mode === "skip"
            ? `Skip ${title}?`
            : kind === "meal"
              ? "What did you eat?"
              : "What did you do?"
      }
      cta={mode === "skip" ? "Skip it" : "Log it"}
      onSubmit={submit}
      secondary={
        mode !== "custom" && (
          <button type="button" onClick={() => setMode("custom")} className={secondaryClass}>
            <PencilLine className="size-4" strokeWidth={2} />
            {kind === "meal" ? "Ate something else" : "Did something else"}
          </button>
        )
      }
    >
      {mode === "log" && (
        <>
          <Eyebrow className="mb-3 block">
            How was it? <Optional />
          </Eyebrow>
          <EmojiScale options={RATINGS} value={rating} onChange={setRating} />
        </>
      )}

      {mode === "skip" && (
        <>
          <Eyebrow className="mb-3 block">
            What got in the way? <Optional />
          </Eyebrow>
          <div className="mb-5 flex flex-wrap gap-1.5">
            {SKIP_REASONS[kind].map((r) => (
              <ChoicePill
                key={r}
                label={r}
                selected={reason === r}
                onClick={() => setReason(reason === r ? null : r)}
              />
            ))}
          </div>
        </>
      )}

      {mode === "custom" && (
        <>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={kind === "meal" ? "e.g. Pad thai" : "e.g. 5k run"}
            className={cn(inputClass, "mb-4")}
          />
          {kind === "meal" ? (
            <>
              <Eyebrow className="mb-2 block">
                Ingredients <Optional />
              </Eyebrow>
              <input
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder="Comma-separated — helps us estimate"
                className={cn(inputClass, "mb-4")}
              />
              <div className={cn(rowClass, "mb-5")}>
                <span className={rowLabelClass}>Portion</span>
                <Stepper
                  size="sm"
                  value={`${portion} bowl${portion > 1 ? "s" : ""}`}
                  onChange={(d) => setPortion((p) => Math.max(1, p + d))}
                />
              </div>
            </>
          ) : (
            <>
              <div className={cn(rowClass, "mb-4")}>
                <span className={rowLabelClass}>Duration</span>
                <Stepper
                  size="sm"
                  value={`${minutes} min`}
                  onChange={(d) => setMinutes((m) => Math.max(5, m + d * 5))}
                />
              </div>
              <Eyebrow className="mb-2 block">Effort</Eyebrow>
              <Segmented
                className="mb-5"
                value={difficulty}
                onChange={(k) => setDifficulty(k as (typeof DIFFICULTIES)[number])}
                options={DIFFICULTIES.map((d) => ({ key: d, label: d[0].toUpperCase() + d.slice(1) }))}
              />
            </>
          )}
        </>
      )}
    </Frame>
  );
}

/* ---------- wellness ---------- */

function WaterBody({ onDone }: { onDone: (status: Status) => void }) {
  const [glasses, setGlasses] = useState(1);
  const [eventId] = useState(() => dataApi.newEventId());
  const label = `${glasses} glass${glasses > 1 ? "es" : ""}`;

  return (
    <Frame
      title="Log water"
      cta={`Add ${label}`}
      onSubmit={async () => {
        await dataApi.logIntake({
          eventId,
          type: "wellness",
          data: { metric: "water", value: glasses, unit: "glass" },
        });
        toast.success(`Added ${label}`);
        onDone("done");
      }}
    >
      <div className={cn(rowClass, "mb-5")}>
        <span className={rowLabelClass}>Glasses · 250ml</span>
        <Stepper value={label} onChange={(d) => setGlasses((g) => Math.max(1, g + d))} />
      </div>
    </Frame>
  );
}

function WeightBody({ onDone }: { onDone: (status: Status) => void }) {
  const [value, setValue] = useState("");
  const [eventId] = useState(() => dataApi.newEventId());

  return (
    <Frame
      title="Log your weight"
      cta="Save weigh-in"
      onSubmit={async () => {
        const kg = Number(value);
        if (!value || !Number.isFinite(kg) || kg <= 0) {
          toast.error("Enter your weight in kg");
          return;
        }
        await dataApi.logIntake({
          eventId,
          type: "wellness",
          data: { metric: "weight", value: kg, unit: "kg" },
        });
        toast.success("Weigh-in saved");
        onDone("done");
      }}
    >
      <div className="mb-4 flex items-baseline gap-2">
        <input
          autoFocus
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value.replace(",", "."))}
          placeholder="0.0"
          className={cn(inputClass, "text-[20px] font-bold")}
        />
        <span className="font-sans text-[16px] font-semibold text-text-muted">kg</span>
      </div>
      <CoachNote>Daily fluctuations are normal — we read the trend, not the single number.</CoachNote>
    </Frame>
  );
}

function FeelBody({ onDone }: { onDone: (status: Status) => void }) {
  const [energy, setEnergy] = useState<number | null>(2);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  // Stable id per event so a retry after a partial failure doesn't double-log.
  const ids = useRef<Record<string, string>>({});
  const idFor = (key: string) => (ids.current[key] ??= dataApi.newEventId());
  const toggle = (s: string) =>
    setSymptoms((l) => (l.includes(s) ? l.filter((x) => x !== s) : [...l, s]));

  return (
    <Frame
      title="How are you feeling?"
      cta="Save"
      onSubmit={async () => {
        const events = [
          ...(energy === null ? [] : [{ metric: "energy" as const, value: energy + 1 }]),
          ...symptoms.map((s) => ({ metric: "issue" as const, value: 1, note: slug(s) })),
        ];
        if (!events.length) {
          toast.error("Pick your energy or something notable");
          return;
        }
        await Promise.all(
          events.map((data) =>
            dataApi.logIntake({
              eventId: idFor(`${data.metric}-${"note" in data ? data.note : ""}`),
              type: "wellness",
              data,
            }),
          ),
        );
        toast.success("Saved — coach will tune today");
        onDone("done");
      }}
    >
      <Eyebrow className="mb-3 block">Energy</Eyebrow>
      <EmojiScale options={ENERGY} value={energy} onChange={setEnergy} />

      <Eyebrow className="mb-3 block">
        Anything notable? <Optional />
      </Eyebrow>
      <div className="mb-5 flex flex-wrap gap-1.5">
        {SYMPTOMS.map((s) => (
          <ChoicePill key={s} label={s} selected={symptoms.includes(s)} onClick={() => toggle(s)} />
        ))}
      </div>

      <CoachNote>Coach uses this to tune today&apos;s suggestions — e.g. steadier energy foods.</CoachNote>
    </Frame>
  );
}
