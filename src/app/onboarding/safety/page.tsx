"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { ArrowRight, Check, HeartPulse, Info, Loader2, Pill, Plus, RotateCcw, X } from "lucide-react";
import { OnboardingShell } from "@/components/chrome/onboarding-shell";
import { ChoicePill } from "@/components/np/selectable";
import { Eyebrow } from "@/components/np/typography";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { data as dataApi, ApiError } from "@/lib/api";
import type { MedicalItem } from "@/lib/api/data";

const ALLERGENS = ["Peanut", "Tree nut", "Shellfish", "Dairy", "Gluten", "Soy"];

/** Dashed add-row that turns into an inline input; commits on Enter or check. */
function AddRow({
  placeholder,
  detailPlaceholder,
  onAdd,
}: {
  placeholder: string;
  detailPlaceholder?: string;
  onAdd: (name: string, detail?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");

  const close = () => {
    setOpen(false);
    setName("");
    setDetail("");
  };
  const commit = () => {
    const n = name.trim();
    if (n) onAdd(n, detail.trim() || undefined);
    close();
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") close();
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-12 w-full items-center gap-2.5 rounded-[13px] border border-dashed border-[#c2cac5] bg-surface px-3.5 text-text-inactive active:scale-[0.99]"
      >
        <Plus className="size-[17px]" strokeWidth={2} />
        <span className="font-sans text-[13px] font-semibold">{placeholder}</span>
      </button>
    );
  }
  return (
    <div className="flex w-full items-center gap-2 rounded-[13px] border-[1.5px] border-brand bg-surface px-3.5 py-2">
      <div className="min-w-0 flex-1">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent font-sans text-[14px] font-semibold text-ink outline-none placeholder:font-medium placeholder:text-text-inactive"
        />
        {detailPlaceholder && (
          <input
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={detailPlaceholder}
            className="mt-1 w-full bg-transparent font-sans text-[12px] font-medium text-text-body outline-none placeholder:text-text-inactive"
          />
        )}
      </div>
      <button type="button" onClick={commit} aria-label="Add" className="text-brand">
        <Check className="size-[18px]" strokeWidth={2.4} />
      </button>
      <button type="button" onClick={close} aria-label="Cancel" className="text-text-inactive">
        <X className="size-[16px]" strokeWidth={2.2} />
      </button>
    </div>
  );
}

function ItemRow({
  item,
  icon,
  onRemove,
}: {
  item: MedicalItem;
  icon: React.ReactNode;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-hairline bg-surface p-3">
      <div className="flex size-[34px] flex-none items-center justify-center rounded-[10px] bg-surface-muted text-[#5b6a63]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-sans text-[13.5px] font-bold text-ink">{item.name}</div>
        {item.notes && (
          <div className="mt-0.5 truncate font-sans text-[11px] font-medium text-text-body">
            {item.notes}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={!item.id}
        aria-label={`Remove ${item.name}`}
        className="flex size-7 flex-none items-center justify-center rounded-lg border border-hairline text-text-body disabled:opacity-40"
      >
        <X className="size-3.5" strokeWidth={2.2} />
      </button>
    </div>
  );
}

export default function SafetyStep() {
  const router = useRouter();
  const [busy, setBusy] = useState(0);
  const {
    data: items,
    error,
    isLoading,
    mutate,
  } = useSWR<MedicalItem[], ApiError>("/data/medical", () => dataApi.getMedical());

  const list = items ?? [];
  const allergies = list.filter((i) => i.type === "allergy");
  const conditions = list.filter((i) => i.type === "condition");
  const medications = list.filter((i) => i.type === "medication");

  /** Optimistically apply `next`, run the mutation, then refetch; rolls back on error. */
  async function run(next: MedicalItem[], fn: () => Promise<unknown>) {
    setBusy((b) => b + 1);
    try {
      await mutate(
        async () => {
          await fn();
          return dataApi.getMedical();
        },
        { optimisticData: next, rollbackOnError: true, revalidate: false },
      );
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not save. Try again.");
    } finally {
      setBusy((b) => b - 1);
    }
  }

  const add = (item: MedicalItem) => run([...list, item], () => dataApi.addMedical(item));
  const remove = (item: MedicalItem) =>
    item.id &&
    run(
      list.filter((i) => i.id !== item.id),
      () => dataApi.deleteMedical(item.id!),
    );

  const toggleAllergen = (name: string) => {
    const found = allergies.find((a) => a.name.toLowerCase() === name.toLowerCase());
    if (found) remove(found);
    else add({ name, type: "allergy", severity: "high" });
  };

  const loadFailed = error && !items;

  return (
    <OnboardingShell
      step={2}
      cta={
        <Button
          disabled={busy > 0 || isLoading || !!loadFailed}
          onClick={() => router.push("/plan/generating")}
          className="w-full gap-2 rounded-[15px] bg-brand py-6 font-bold"
        >
          {busy > 0 ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Saving…
            </>
          ) : (
            <>
              Build my plan <ArrowRight className="size-4 stroke-[2.5]" />
            </>
          )}
        </Button>
      }
    >
      <div className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-brand">
        Safety first · step 2
      </div>
      <h1 className="mt-2 font-sans text-2xl font-extrabold leading-[1.2] tracking-[-0.01em] text-ink">
        Keeping you safe
      </h1>
      <p className="mt-2 font-sans text-[13px] font-medium leading-[1.5] text-text-muted">
        Allergies, conditions and medications shape every plan we build. Add what applies — you can
        change it anytime.
      </p>

      {loadFailed ? (
        <div className="mt-5 flex flex-col items-start gap-3 rounded-[14px] border border-hairline bg-surface p-4">
          <p className="font-sans text-[13px] font-medium text-text-body">
            Couldn&rsquo;t load your safety profile.
          </p>
          <Button variant="outline" size="sm" onClick={() => mutate()} className="gap-1.5">
            <RotateCcw className="size-3.5" /> Try again
          </Button>
        </div>
      ) : isLoading ? (
        <div className="mt-5 space-y-3">
          <Skeleton className="h-10 w-full rounded-[13px]" />
          <Skeleton className="h-12 w-full rounded-[13px]" />
          <Skeleton className="h-12 w-full rounded-[13px]" />
        </div>
      ) : (
        <>
          <Eyebrow className="mb-2.5 mt-5 block tracking-[0.05em]">Common allergens</Eyebrow>
          <div className="flex flex-wrap gap-2">
            {ALLERGENS.map((a) => (
              <ChoicePill
                key={a}
                label={a}
                selected={allergies.some((x) => x.name.toLowerCase() === a.toLowerCase())}
                onClick={() => toggleAllergen(a)}
              />
            ))}
            {allergies
              .filter((x) => !ALLERGENS.some((a) => a.toLowerCase() === x.name.toLowerCase()))
              .map((x) => (
                <ChoicePill key={x.name} label={x.name} selected onClick={() => remove(x)} />
              ))}
          </div>
          <div className="mt-2.5">
            <AddRow
              placeholder="Add your own allergen"
              onAdd={(name) => add({ name, type: "allergy", severity: "high" })}
            />
          </div>

          <Eyebrow className="mb-2.5 mt-5 block tracking-[0.05em]">Conditions</Eyebrow>
          <div className="flex flex-col gap-2">
            {conditions.map((c) => (
              <ItemRow
                key={c.id ?? c.name}
                item={c}
                icon={<HeartPulse className="size-[17px]" strokeWidth={1.9} />}
                onRemove={() => remove(c)}
              />
            ))}
            <AddRow
              placeholder="Add a condition (e.g. type 2 diabetes)"
              onAdd={(name) => add({ name, type: "condition" })}
            />
          </div>

          <Eyebrow className="mb-2.5 mt-5 block tracking-[0.05em]">Medications</Eyebrow>
          <div className="flex flex-col gap-2">
            {medications.map((m) => (
              <ItemRow
                key={m.id ?? m.name}
                item={m}
                icon={<Pill className="size-[17px]" strokeWidth={1.9} />}
                onRemove={() => remove(m)}
              />
            ))}
            <AddRow
              placeholder="Add a medication"
              detailPlaceholder="Dose & frequency (e.g. 500 mg · twice a day)"
              onAdd={(name, detail) =>
                add({
                  name,
                  type: "medication",
                  medications: [name.toLowerCase()],
                  notes: detail,
                })
              }
            />
          </div>

          {medications.length > 0 && (
            <div className="mt-3.5 flex items-start gap-2.5 rounded-xl border border-caution-border bg-caution-surface px-3 py-2.5">
              <Info className="mt-px size-3.5 flex-none text-caution" strokeWidth={2} />
              <span className="font-sans text-[11.5px] font-medium leading-[1.4] text-caution">
                A dietitian will glance over your plan because of your medication — we&rsquo;ll set
                expectations, never alarm.
              </span>
            </div>
          )}
        </>
      )}
    </OnboardingShell>
  );
}
