"use client";

import Link from "next/link";
import { ShoppingBasket } from "lucide-react";
import { LogoTile, Wordmark } from "@/components/brand/logo";
import { SafeBadge } from "@/components/np/status-badge";
import { cn } from "@/lib/utils";

/** Top bar showing a plain screen title on the left + SAFE badge on the right. */
export function TitleTopBar({ title }: { title: string }) {
  return (
    <TopBar
      left={
        <span className="font-sans text-[17px] font-extrabold tracking-[-0.02em] text-ink">
          {title}
        </span>
      }
      right={
        <Link href="/safety" aria-label="Safety">
          <SafeBadge />
        </Link>
      }
    />
  );
}

/** Square icon button used across the top bar. */
export function TopBarIconButton({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Link> & { className?: string }) {
  return (
    <Link
      className={cn(
        "flex size-8 items-center justify-center rounded-[9px] border border-control-border bg-surface text-text-strong active:scale-95",
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}

export function TopBar({
  left,
  right,
  className,
}: {
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-[var(--np-topbar-h)] items-center justify-between border-b border-hairline bg-app-bg/95 px-4 backdrop-blur-md",
        className,
      )}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex items-center gap-1.5">
        {left ?? (
          <Link href="/" className="flex items-center gap-1.5">
            <LogoTile />
            <Wordmark />
          </Link>
        )}
      </div>
      <div className="flex items-center gap-2">
        {right ?? (
          <>
            <TopBarIconButton href="/kitchen" aria-label="Kitchen">
              <ShoppingBasket className="size-4" strokeWidth={1.8} />
            </TopBarIconButton>
            <Link href="/safety" aria-label="Safety">
              <SafeBadge />
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
