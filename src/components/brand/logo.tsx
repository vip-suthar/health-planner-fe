import { cn } from "@/lib/utils";

/** NutriPlan leaf mark — exact path from the design system. */
export function LogoMark({
  size = 24,
  className,
  strokeWidth = 2,
  withVein = true,
}: {
  size?: number;
  className?: string;
  strokeWidth?: number;
  withVein?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M4 20c0-9 7-15 16-15 0 9-6 16-16 15z" />
      {withVein && <path d="M9 16c2-4 5-6 9-7" />}
    </svg>
  );
}

/** Rounded square logo tile (green bg, white leaf). */
export function LogoTile({
  size = 22,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-[7px] bg-brand text-white",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <LogoMark size={Math.round(size * 0.55)} strokeWidth={2.2} withVein={false} />
    </span>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-sans text-[15px] font-extrabold tracking-[-0.02em] text-ink",
        className,
      )}
    >
      NutriPlan
    </span>
  );
}
