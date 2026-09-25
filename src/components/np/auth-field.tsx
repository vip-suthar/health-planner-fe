"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Eyebrow } from "@/components/np/typography";

type BaseProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className">;

/**
 * Labeled input row matching the G2/G3 auth screens: mono uppercase label,
 * leading icon, brand focus ring, optional show/hide toggle for passwords.
 */
export function AuthField({
  label,
  icon,
  type = "text",
  ...inputProps
}: BaseProps & { label: string; icon: ReactNode }) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword && show ? "text" : type;

  return (
    <div className="mt-3.5 first:mt-0">
      <Eyebrow className="mb-2 block tracking-[0.05em]">{label}</Eyebrow>
      <div className="flex h-[52px] items-center gap-2.5 rounded-[14px] border-[1.5px] border-control-border bg-surface px-3.5 transition-colors focus-within:border-brand focus-within:shadow-[0_0_0_3px_rgba(54,121,93,0.12)]">
        <span className="flex text-text-muted [&_svg]:size-[18px]">{icon}</span>
        <input
          type={resolvedType}
          className={cn(
            "flex-1 bg-transparent font-sans text-[15px] font-medium text-ink outline-none placeholder:text-text-inactive",
            isPassword && "tracking-[0.08em]",
          )}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="flex text-text-inactive active:scale-95"
          >
            {show ? (
              <EyeOff className="size-[19px]" strokeWidth={1.8} />
            ) : (
              <Eye className="size-[19px]" strokeWidth={1.8} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
