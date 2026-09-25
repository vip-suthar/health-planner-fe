import { TopBar } from "./top-bar";
import { BottomNav } from "./bottom-nav";
import { FabStack } from "./fab-stack";
import { CoachPopover } from "@/components/np/coach-popover";
import { AuthGate } from "@/lib/auth/auth-gate";
import { cn } from "@/lib/utils";

/**
 * Device frame: fixed top bar + bottom nav, scrolling content, floating FABs.
 * Centered with a max width so it reads as a single mobile column on desktop,
 * fills the viewport on a real device.
 */
export function AppShell({
  children,
  topBar,
  fab = true,
  contentClassName,
}: {
  children: React.ReactNode;
  topBar?: React.ReactNode;
  fab?: boolean;
  contentClassName?: string;
}) {
  return (
    <AuthGate>
      <div className="relative mx-auto flex h-dvh w-full max-w-110 flex-col overflow-hidden bg-app-bg">
        {topBar ?? <TopBar />}
        <main
          className={cn(
            "no-scrollbar flex-1 overflow-y-auto px-4 pb-24 pt-4",
            contentClassName,
          )}
        >
          {children}
        </main>
        {fab && <FabStack />}
        <BottomNav />
      </div>
      <CoachPopover />
    </AuthGate>
  );
}
