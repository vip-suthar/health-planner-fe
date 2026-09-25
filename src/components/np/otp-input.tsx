"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

export function OtpInput({
  length = 6,
  value,
  onChange,
  error,
}: {
  length?: number;
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function focusAt(i: number) {
    refs.current[Math.max(0, Math.min(length - 1, i))]?.focus();
  }

  /** Fill from index `start` with the digits in `text` (paste / autofill / SMS). */
  function fill(start: number, text: string) {
    const digits = text.replace(/\D/g, "");
    if (!digits) return;
    const next = value.split("");
    for (let k = 0; k < digits.length && start + k < length; k++) {
      next[start + k] = digits[k];
    }
    const joined = next.join("").slice(0, length);
    onChange(joined);
    focusAt(Math.min(start + digits.length, length - 1));
  }

  function setChar(i: number, raw: string) {
    // Multi-char (paste into a box, browser autofill) → spread across boxes.
    if (raw.length > 1) return fill(i, raw);
    const next = value.split("");
    next[i] = raw.replace(/\D/g, "").slice(-1);
    onChange(next.join("").slice(0, length));
    if (raw && i < length - 1) refs.current[i + 1]?.focus();
  }

  return (
    <div
      className="grid gap-2.5"
      style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }}
    >
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={length}
          value={value[i] ?? ""}
          onChange={(e) => setChar(i, e.target.value)}
          onPaste={(e) => {
            e.preventDefault();
            fill(i, e.clipboardData.getData("text"));
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !value[i] && i > 0) refs.current[i - 1]?.focus();
          }}
          className={cn(
            "h-[60px] w-full min-w-0 rounded-[13px] border-[1.5px] bg-surface text-center font-mono text-[26px] font-semibold outline-none transition-colors",
            error
              ? "border-[#e2a9a5] bg-[#fbeeed] text-[#9a3d38]"
              : "border-control-border text-ink focus:border-brand focus:shadow-[0_0_0_3px_rgba(54,121,93,0.12)]",
          )}
        />
      ))}
    </div>
  );
}
