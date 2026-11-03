"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Bean,
  Beef,
  CakeSlice,
  Carrot,
  Check,
  Cookie,
  Croissant,
  CupSoda,
  Droplet,
  Flame,
  Milk,
  Package,
  Plus,
  Snowflake,
  Soup,
  Trash2,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import { AppShell } from "@/components/chrome/app-shell";
import { BackHeader } from "@/components/chrome/back-header";
import { FlowCTA } from "@/components/chrome/flow-screen";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Segmented } from "@/components/np/segmented";
import { ChoicePill } from "@/components/np/selectable";
import { Stepper } from "@/components/np/stepper";
import { StatusBadge } from "@/components/np/status-badge";
import { Eyebrow } from "@/components/np/typography";
import useSWR from "swr";
import { data as dataApi } from "@/lib/api";
import type {
  Kitchen,
  KitchenItem,
  ShoppingLine,
  StapleStatus,
  StockLevel,
  Storage,
} from "@/lib/api/data";
import { cn } from "@/lib/utils";

const CATEGORY_ICON: Record<string, LucideIcon> = {
  produce: Carrot,
  dairy: Milk,
  protein: Beef,
  grain: Wheat,
  legume: Bean,
  bakery: Croissant,
  spice: Flame,
  condiment: Soup,
  oil_fat: Droplet,
  baking: CakeSlice,
  frozen: Snowflake,
  beverage: CupSoda,
  snack: Cookie,
};

const STORAGES: { key: Storage; label: string }[] = [
  { key: "fridge", label: "Fridge" },
  { key: "freezer", label: "Freezer" },
  { key: "pantry", label: "Pantry" },
];

const LEVELS: StockLevel[] = ["plenty", "some", "low", "out"];

const NEXT_STATUS: Record<StapleStatus, StapleStatus> = { ok: "low", low: "out", out: "ok" };

const STAPLE_STYLE: Record<StapleStatus, string> = {
  ok: "border border-border-strong bg-surface text-text-strong",
  low: "border border-caution-border bg-caution-surface text-caution",
  out: "border border-transparent bg-danger-surface text-danger",
};

const listClass =
  "overflow-hidden rounded-2xl border border-hairline bg-surface [&>*:not(:last-child)]:border-b [&>*]:border-[#eef1ef]";
const quickClass =
  "flex items-center gap-1 rounded-lg bg-surface-muted px-2 py-1.5 font-sans text-[11px] font-semibold text-text-strong active:scale-[0.97]";
const inputClass =
  "h-12 w-full rounded-[13px] border border-control-border bg-surface px-3.5 font-sans text-[14px] font-medium text-ink outline-none focus:border-brand";

const days = (n: number) => `${n} day${n === 1 ? "" : "s"}`;
const shiftDate = (iso: string, n: number) =>
  new Date(Date.parse(iso) + n * 86400000).toISOString().slice(0, 10);
const amount = (it: { qty?: number; unit?: string; level?: string }) =>
  it.qty != null ? `${it.qty}${it.unit ? ` ${it.unit}` : ""}` : (it.level ?? "");
const reason = (l: ShoppingLine) =>
  `For ${[
    ...new Set(
      l.for.map(
        (f) =>
          `${new Date(`${f.date}T00:00`).toLocaleDateString("en", { weekday: "short" })} ${f.slot.toLowerCase()}`,
      ),
    ),
  ].join(", ")}`;

export default function KitchenPage() {
  const [tab, setTab] = useState("pantry");
  const { data: kitchen, isLoading, mutate } = useSWR("/data/kitchen", () =>
    dataApi.getKitchen(),
  );
  const { data: shop, mutate: mutateShop } = useSWR("/data/kitchen/shopping-list", () =>
    dataApi.getKitchenShoppingList(),
  );
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState(false);
  const [names, setNames] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const items = kitchen?.items ?? [];
  const staples = kitchen?.staples ?? [];
  const useSoon = items.filter((it) => it.freshness === "use_soon");
  const open = items.find((it) => it.id === editingId);
  const [editing, setEditing] = useState(open);
  if (open && open !== editing) setEditing(open);
  const lines = shop?.shoppingList ?? [];
  const lowLines = lines.filter((l) => !l.for.length);
  const planLines = lines.filter((l) => l.for.length);
  const aisles = [...new Set(planLines.map((l) => l.category))];
  const tickedLines = lines.filter((l) => checked[l.ingredientId]);

  async function write(req: Promise<Kitchen>, optimisticData?: Kitchen) {
    try {
      await mutate(req, { optimisticData, revalidate: false });
      mutateShop();
      return true;
    } catch {
      toast.error("Could not save that — try again.");
      return false;
    }
  }

  function cycleStaple(name: string) {
    if (!kitchen) return;
    const next = staples.map((s) =>
      s.name === name ? { ...s, status: NEXT_STATUS[s.status] } : s,
    );
    write(
      dataApi.updateStaples(next.map(({ name, status }) => ({ name, status }))),
      { ...kitchen, staples: next },
    );
  }

  async function addNames() {
    const list = names.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
    if (!list.length) {
      toast.error("What do you have?");
      return;
    }
    setBusy(true);
    if (await write(dataApi.addKitchenItems(list.map((name) => ({ name }))))) {
      toast.success(`Added ${list.length === 1 ? list[0] : `${list.length} items`}`);
      setNames("");
      setAdding(false);
    }
    setBusy(false);
  }

  async function boughtThese() {
    setBusy(true);
    if (
      await write(
        dataApi.addKitchenItems(tickedLines.map(({ name, qty, unit }) => ({ name, qty, unit }))),
      )
    ) {
      toast.success("Added to your kitchen");
      setChecked({});
    }
    setBusy(false);
  }

  function removeItem(id: string) {
    setEditingId(null);
    write(dataApi.deleteKitchenItem(id));
  }

  return (
    <AppShell topBar={<BackHeader title="Kitchen" />} fab={false} contentClassName="pb-8">
      <Segmented
        className="mb-4"
        value={tab}
        onChange={setTab}
        options={[
          { key: "pantry", label: "Pantry" },
          {
            key: "shopping",
            label: (
              <span>
                Shopping{" "}
                <span className="font-mono text-[10px] font-semibold text-caution">
                  {lines.length}
                </span>
              </span>
            ),
          },
        ]}
      />

      {tab === "pantry" ? (
        <>
          {isLoading && (
            <div className="py-8 text-center font-sans text-[13px] font-medium text-text-inactive">
              Loading your kitchen…
            </div>
          )}

          {useSoon.length > 0 && (
            <>
              <Eyebrow className="mb-2.5 block tracking-[0.05em]">Use soon</Eyebrow>
              <div className="no-scrollbar -mx-4 mb-4 flex gap-2.5 overflow-x-auto px-4">
                {useSoon.map((it) => (
                  <div
                    key={it.id}
                    className="w-[210px] flex-none rounded-2xl border border-caution-border bg-surface p-3"
                  >
                    <div className="mb-1.5 truncate font-sans text-[13.5px] font-semibold text-ink">
                      {it.name}
                    </div>
                    <FreshnessBadge item={it} />
                    <div className="mt-2.5 flex gap-1.5">
                      {it.storage !== "freezer" && (
                        <button
                          type="button"
                          className={quickClass}
                          onClick={() => write(dataApi.updateKitchenItem(it.id, { storage: "freezer" }))}
                        >
                          <Snowflake className="size-3" strokeWidth={2.2} />
                          Freeze
                        </button>
                      )}
                      <button
                        type="button"
                        className={quickClass}
                        onClick={() => write(dataApi.deleteKitchenItem(it.id))}
                      >
                        <Check className="size-3" strokeWidth={2.6} />
                        Used it
                      </button>
                      {it.expiresOn && (
                        <button
                          type="button"
                          className={quickClass}
                          onClick={() =>
                            write(
                              dataApi.updateKitchenItem(it.id, {
                                expiresOn: shiftDate(it.expiresOn!, 2),
                              }),
                            )
                          }
                        >
                          +2 days
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!isLoading && !items.length && (
            <div className="mb-4 rounded-2xl border border-hairline bg-surface px-3.5 py-6 text-center font-sans text-[13px] font-medium text-text-inactive">
              Nothing tracked yet. Tap + to add what you have.
            </div>
          )}

          {STORAGES.map(({ key, label }) => {
            const group = items.filter((it) => it.storage === key);
            if (!group.length) return null;
            return (
              <div key={key} className="mb-4">
                <Eyebrow className="mb-2.5 block tracking-[0.05em]">
                  {label} · {group.length}
                </Eyebrow>
                <div className={listClass}>
                  {group.map((it) => {
                    const Icon = CATEGORY_ICON[it.category] ?? Package;
                    return (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => setEditingId(it.id)}
                        className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
                      >
                        <div className="flex size-[34px] flex-none items-center justify-center rounded-[10px] bg-surface-muted text-text-body">
                          <Icon className="size-4" strokeWidth={1.8} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-sans text-[13.5px] font-semibold leading-[1.1] text-ink">
                            {it.name}
                          </div>
                          <div className="mt-1 font-mono text-[10px] font-medium text-[#7e867f]">
                            {amount(it)}
                          </div>
                        </div>
                        <FreshnessBadge item={it} />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {staples.length > 0 && (
            <>
              <Eyebrow className="mb-2.5 block tracking-[0.05em]">
                Staples · tap if low or out
              </Eyebrow>
              <div className="flex flex-wrap gap-2">
                {staples.map((s) => (
                  <button
                    key={s.ingredientId}
                    type="button"
                    onClick={() => cycleStaple(s.name)}
                    className={cn(
                      "rounded-full px-3 py-1.5 font-sans text-[12px] font-semibold active:scale-[0.97]",
                      STAPLE_STYLE[s.status],
                    )}
                  >
                    {s.name}
                    {s.status !== "ok" && ` · ${s.status}`}
                  </button>
                ))}
              </div>
            </>
          )}

          <button
            type="button"
            onClick={() => setAdding(true)}
            aria-label="Add to kitchen"
            className="absolute bottom-[76px] right-4 z-40 flex size-[56px] items-center justify-center rounded-[18px] bg-brand text-white shadow-fab active:scale-95"
          >
            <Plus className="size-6" strokeWidth={2.4} />
          </button>
        </>
      ) : (
        <div className="rounded-2xl border border-hairline bg-surface p-3.5">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-sans text-[14px] font-bold text-ink">Shopping list</span>
            <span className="font-mono text-[10px] font-medium text-[#7e867f]">
              NEXT {shop?.days ?? 3} DAYS · BY AISLE
            </span>
          </div>
          {shop && shop.plannedDays < shop.days && (
            <div className="mb-3 font-sans text-[12px] font-medium text-text-muted">
              Covers {shop.plannedDays} of {shop.days} days (only planned days)
            </div>
          )}
          {shop && !lines.length && (
            <div className="py-4 text-center font-sans text-[13px] font-medium text-text-inactive">
              You have everything you need.
            </div>
          )}
          {[
            ...aisles.map((a) => ({
              title: a.replace("_", " & "),
              rows: planLines.filter((l) => l.category === a),
            })),
            { title: "Running low", rows: lowLines },
          ].map(
            (g) =>
              g.rows.length > 0 && (
                <div key={g.title} className="mb-2">
                  <Eyebrow className="mb-1 block text-[10px] tracking-[0.04em]">{g.title}</Eyebrow>
                  {g.rows.map((l) => {
                    const on = checked[l.ingredientId];
                    return (
                      <button
                        key={l.ingredientId}
                        type="button"
                        onClick={() =>
                          setChecked((c) => ({ ...c, [l.ingredientId]: !c[l.ingredientId] }))
                        }
                        className="flex w-full items-center gap-2.5 py-[7px] text-left"
                      >
                        <span
                          className={cn(
                            "flex size-5 flex-none items-center justify-center rounded-md border-[1.5px]",
                            on ? "border-brand bg-brand text-white" : "border-[#c2cac5]",
                          )}
                        >
                          {on && <Check className="size-3" strokeWidth={3} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              "block font-sans text-[13px] font-medium",
                              on ? "text-text-inactive line-through" : "text-[#2a332e]",
                            )}
                          >
                            {l.name}
                            {l.qty != null && ` · ${amount(l)}`}
                          </span>
                          {l.for.length > 0 && (
                            <span className="block truncate font-mono text-[10px] font-medium text-[#7e867f]">
                              {reason(l)}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ),
          )}
          {lines.length > 0 && (
            <button
              type="button"
              disabled={!tickedLines.length || busy}
              onClick={boughtThese}
              className="mt-3 flex h-[42px] w-full items-center justify-center rounded-xl bg-brand font-sans text-[13px] font-bold text-white active:scale-[0.99] disabled:opacity-50"
            >
              {tickedLines.length ? `Bought these · ${tickedLines.length}` : "Tick what you bought"}
            </button>
          )}
        </div>
      )}

      <Sheet open={adding} onOpenChange={setAdding}>
        <SheetContent
          side="bottom"
          className="mx-auto max-w-110 gap-0 rounded-t-[24px] border-hairline pb-[max(env(safe-area-inset-bottom),16px)]"
        >
          <SheetHeader className="pb-1 pr-12">
            <SheetTitle className="font-sans text-[18px] font-extrabold leading-tight tracking-[-0.01em] text-ink">
              Add to kitchen
            </SheetTitle>
          </SheetHeader>
          <form
            className="px-4 pt-2"
            onSubmit={(e) => {
              e.preventDefault();
              addNames();
            }}
          >
            <input
              autoFocus
              value={names}
              onChange={(e) => setNames(e.target.value)}
              placeholder="spinach, eggs, rice"
              className={inputClass}
            />
            <div className="mt-2 font-sans text-[12px] font-medium text-text-muted">
              Add several at once with commas. We&apos;ll estimate amounts and dates.
            </div>
          </form>
          <div className="px-4 pt-4">
            <FlowCTA onClick={busy ? undefined : addNames} className={cn(busy && "opacity-60")}>
              <Plus className="size-4" strokeWidth={2.6} />
              Add
            </FlowCTA>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!open} onOpenChange={(o) => !o && setEditingId(null)}>
        <SheetContent
          side="bottom"
          className="mx-auto max-w-110 gap-0 rounded-t-[24px] border-hairline pb-[max(env(safe-area-inset-bottom),16px)]"
        >
          {editing && (
            <>
              <SheetHeader className="pb-1 pr-12">
                <SheetTitle className="font-sans text-[18px] font-extrabold leading-tight tracking-[-0.01em] text-ink">
                  {editing.name}
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 px-4 pt-2">
                {editing.expiresOn && (
                  <div className="flex items-center justify-between rounded-[11px] bg-surface-muted px-3 py-2">
                    <span className="font-sans text-[12px] font-semibold text-text-strong">
                      Good for
                    </span>
                    <Stepper
                      value={
                        editing.daysLeft == null || editing.daysLeft < 0
                          ? "Expired"
                          : editing.daysLeft === 0
                            ? "Today"
                            : `~${days(editing.daysLeft)}`
                      }
                      onChange={(d) =>
                        write(
                          dataApi.updateKitchenItem(editing.id, {
                            expiresOn: shiftDate(editing.expiresOn!, d),
                          }),
                        )
                      }
                    />
                  </div>
                )}
                {editing.qty != null && (
                  <div className="flex items-center justify-between rounded-[11px] bg-surface-muted px-3 py-2">
                    <span className="font-sans text-[12px] font-semibold text-text-strong">
                      Amount
                    </span>
                    <Stepper
                      value={amount(editing)}
                      onChange={(d) =>
                        editing.qty! + d > 0 &&
                        write(dataApi.updateKitchenItem(editing.id, { qty: editing.qty! + d }))
                      }
                    />
                  </div>
                )}
                <div>
                  <Eyebrow className="mb-2 block">How much is left</Eyebrow>
                  <div className="flex flex-wrap gap-2">
                    {LEVELS.map((l) => (
                      <ChoicePill
                        key={l}
                        label={l[0].toUpperCase() + l.slice(1)}
                        selected={editing.level === l}
                        onClick={() => write(dataApi.updateKitchenItem(editing.id, { level: l }))}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <Eyebrow className="mb-2 block">Stored in</Eyebrow>
                  <Segmented
                    value={editing.storage}
                    onChange={(s) =>
                      write(dataApi.updateKitchenItem(editing.id, { storage: s as Storage }))
                    }
                    options={STORAGES}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(editing.id)}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] border border-control-border bg-surface font-sans text-[13px] font-semibold text-text-strong active:scale-[0.99]"
                >
                  <Trash2 className="size-4" strokeWidth={2} />
                  Used up or thrown out
                </button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}

function FreshnessBadge({ item }: { item: KitchenItem }) {
  const { freshness, daysLeft, dateType } = item;
  if (freshness === "use_soon")
    return (
      <StatusBadge tone="caution" className="border-0">
        {daysLeft ? `Use in ${days(daysLeft)}` : "Use today"}
      </StatusBadge>
    );
  if (freshness === "expired")
    return dateType === "use_by" ? (
      <StatusBadge tone="danger">Past use-by, don&apos;t eat</StatusBadge>
    ) : (
      <StatusBadge tone="neutral" className="text-caution">
        Past best-before, check it
      </StatusBadge>
    );
  if (daysLeft == null) return null;
  return <StatusBadge tone="neutral">~{days(daysLeft)}</StatusBadge>;
}
