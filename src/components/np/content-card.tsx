"use client";

import { useRouter } from "next/navigation";
import type { ContentCard as ContentCardType } from "@/lib/data";
import { cn } from "@/lib/utils";

const TONE_TEXT = {
  forecast: "text-forecast",
  brand: "text-brand",
  caution: "text-caution",
};

// Hatch backgrounds stand in for imagery, per the design.
const TONE_HATCH = {
  forecast:
    "repeating-linear-gradient(135deg,#eaf0f4,#eaf0f4 5px,#f3f7f9 5px,#f3f7f9 10px)",
  brand:
    "repeating-linear-gradient(135deg,#ecf1ee,#ecf1ee 5px,#f5f8f6 5px,#f5f8f6 10px)",
  caution:
    "repeating-linear-gradient(135deg,#f0eee9,#f0eee9 5px,#f8f6f2 5px,#f8f6f2 10px)",
};

export function ContentCard({
  card,
  imageHeight = 70,
  className,
}: {
  card: ContentCardType;
  imageHeight?: number;
  className?: string;
}) {
  const router = useRouter();
  const label = card.readTime
    ? `${card.kind.toUpperCase()} · ${card.readTime}`
    : card.kind.toUpperCase();
  // CMS cards open the reader by slug; legacy mock cards keep their static route.
  const href = card.slug
    ? `/article?slug=${encodeURIComponent(card.slug)}`
    : card.kind === "recipe"
      ? "/recipe"
      : "/article";
  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      className={cn(
        "flex-1 overflow-hidden rounded-[14px] border border-hairline bg-surface text-left active:scale-[0.98] transition-transform",
        className,
      )}
    >
      <div
        style={{
          height: imageHeight,
          background: card.coverUrl ? undefined : TONE_HATCH[card.tone],
          backgroundImage: card.coverUrl ? `url(${card.coverUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="px-2.5 py-2.5">
        <span
          className={cn(
            "font-mono text-[9px] font-semibold tracking-[0.03em]",
            TONE_TEXT[card.tone],
          )}
        >
          {label}
        </span>
        <div className="mt-1 font-sans text-[12px] font-semibold leading-[1.3] text-ink">
          {card.title}
        </div>
      </div>
    </button>
  );
}
