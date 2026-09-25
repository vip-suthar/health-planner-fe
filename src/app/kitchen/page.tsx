"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { AppShell } from "@/components/chrome/app-shell";
import { BackHeader } from "@/components/chrome/back-header";
import { Segmented } from "@/components/np/segmented";
import { StatusBadge } from "@/components/np/status-badge";
import { Eyebrow } from "@/components/np/typography";
import { pantry as pantryMock, shoppingList as shoppingMock } from "@/lib/data";
import useSWR from "swr";
import { data as dataApi } from "@/lib/api";
import { mapPantry, mapShoppingItems } from "@/lib/mappers";
import { cn } from "@/lib/utils";

export default function KitchenPage() {
  const [tab, setTab] = useState("pantry");
  const { data: pantryRaw } = useSWR("/data/pantry", () => dataApi.getPantry());
  const { data: shoppingRaw } = useSWR("/data/shopping-list", () =>
    dataApi.getShoppingList(),
  );

  const pantry = mapPantry(pantryRaw?.items ?? null) ?? pantryMock;
  const shopItems = mapShoppingItems(shoppingRaw ?? null) ?? shoppingMock.items;
  const shopAisle = shoppingMock.aisle;
  const [checked, setChecked] = useState<Record<number, boolean>>({});

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
                  {shopItems.length}
                </span>
              </span>
            ),
          },
        ]}
      />

      {tab === "pantry" ? (
        <>
          <div className="mb-3 flex items-center justify-between">
            <Eyebrow className="tracking-[0.05em]">
              On hand · {pantry.length} items
            </Eyebrow>
            <button className="font-sans text-[12px] font-semibold text-brand">+ Add</button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-hairline bg-surface [&>*:not(:last-child)]:border-b [&>*]:border-[#eef1ef]">
            {pantry.map((item) => (
              <div key={item.name} className="flex items-center gap-3 px-3.5 py-3">
                <div className="size-[34px] flex-none rounded-[10px] bg-surface-muted" />
                <div className="flex-1">
                  <div className="font-sans text-[13.5px] font-semibold leading-[1.1] text-ink">
                    {item.name}
                  </div>
                  <div className="mt-1 font-mono text-[10px] font-medium text-[#7e867f]">
                    {item.qty}
                  </div>
                </div>
                <StatusBadge tone={item.tag.tone} className="border-0">
                  {item.tag.text}
                </StatusBadge>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {/* shopping preview (always shown below; primary on Shopping tab) */}
      <div className="mt-3.5 rounded-2xl border border-hairline bg-surface p-3.5">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-sans text-[14px] font-bold text-ink">Shopping list</span>
          <span className="font-mono text-[10px] font-medium text-[#7e867f]">
            FOR FIRM DAYS · BY AISLE
          </span>
        </div>
        <Eyebrow className="mb-2 block text-[10px] tracking-[0.04em]">
          {shopAisle}
        </Eyebrow>
        {shopItems.map((it, i) => {
          const on = checked[i];
          return (
            <button
              key={it.name}
              type="button"
              onClick={() => setChecked((c) => ({ ...c, [i]: !c[i] }))}
              className="flex w-full items-center gap-2.5 py-[7px] text-left"
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-md border-[1.5px]",
                  on ? "border-brand bg-brand text-white" : "border-[#c2cac5]",
                )}
              >
                {on && <Check className="size-3" strokeWidth={3} />}
              </span>
              <span
                className={cn(
                  "flex-1 font-sans text-[13px] font-medium",
                  on ? "text-text-inactive line-through" : "text-[#2a332e]",
                )}
              >
                {it.name}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => toast.success("Checklist ready")}
          className="mt-3 flex h-[42px] w-full items-center justify-center rounded-xl bg-brand font-sans text-[13px] font-bold text-white active:scale-[0.99]"
        >
          Check off as you shop
        </button>
      </div>
    </AppShell>
  );
}
