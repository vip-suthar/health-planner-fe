"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TABS, activeTab } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const current = activeTab(pathname);

  return (
    <nav
      className="sticky bottom-0 z-30 flex h-(--np-bottomnav-h) items-stretch justify-around border-t border-hairline bg-surface px-1.5 pt-[7px]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {TABS.map((tab) => {
        const isActive = current === tab.key;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1.25",
              isActive ? "text-brand" : "text-text-inactive",
            )}
          >
            {isActive ? (
              <span className="flex h-6.5 w-11.5 items-center justify-center rounded-full bg-brand-surface">
                <Icon className="size-5" strokeWidth={1.9} />
              </span>
            ) : (
              <Icon className="size-5.25" strokeWidth={1.8} />
            )}
            <span
              className={cn(
                "font-sans text-[10px] leading-none",
                isActive ? "font-bold" : "font-medium",
              )}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
