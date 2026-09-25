import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Full-screen flow layout (native-first): fixed header, scrolling body,
 * optional sticky footer CTA. Used by log, auth, and onboarding flows.
 */
export function FlowScreen({
  header,
  footer,
  children,
  bodyClassName,
}: {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  bodyClassName?: string;
}) {
  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-110 flex-col bg-app-bg">
      {header}
      <main className={cn("no-scrollbar flex-1 overflow-y-auto px-4.5 py-4", bodyClassName)}>
        {children}
      </main>
      {footer && (
        <div
          className="border-t border-hairline bg-app-bg px-4.5 pt-3"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom),20px)" }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}

/** Primary full-width CTA used in flow footers. */
export function FlowCTA({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "h-[50px] w-full gap-1.5 rounded-[15px] bg-brand font-sans text-[15px] font-bold text-white active:scale-[0.99]",
        className,
      )}
    >
      {children}
    </Button>
  );
}
