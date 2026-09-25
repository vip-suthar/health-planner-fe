"use client";

import { useEffect, useRef, useState } from "react";
import {
  Clock,
  Loader2,
  RefreshCw,
  RotateCcw,
  Send,
  Sparkles,
  WifiOff,
  X,
} from "lucide-react";
import { Markdown } from "@/components/np/markdown";
import { useCoachUi } from "@/lib/coach/store";
import {
  useCoachSocket,
  type CoachMessage,
  type ConnStatus,
} from "@/lib/coach/use-coach-socket";
import { cn } from "@/lib/utils";

function AiAvatar() {
  return (
    <div className="flex size-[30px] flex-none items-center justify-center rounded-[10px] border border-hairline bg-surface text-brand">
      <Sparkles className="size-[15px] fill-brand" />
    </div>
  );
}

/** Header presence pill — colour + label + optional spinner per socket state. */
function HeaderStatus({ status }: { status: ConnStatus }) {
  const map: Record<
    ConnStatus,
    { label: string; dot: string; spin?: boolean; icon?: typeof WifiOff }
  > = {
    open: { label: "Online", dot: "bg-brand" },
    connecting: { label: "Connecting…", dot: "bg-forecast", spin: true },
    reconnecting: { label: "Reconnecting…", dot: "bg-caution", spin: true },
    offline: { label: "Offline", dot: "bg-text-inactive", icon: WifiOff },
    error: { label: "Can't connect", dot: "bg-caution" },
  };
  const s = map[status];
  return (
    <div className="mt-0.5 flex items-center gap-1.5">
      {s.spin ? (
        <Loader2 className="size-[11px] animate-spin text-text-inactive" strokeWidth={2.4} />
      ) : s.icon ? (
        <s.icon className="size-[11px] text-text-inactive" strokeWidth={2.2} />
      ) : (
        <span className={cn("size-1.5 rounded-full", s.dot)} />
      )}
      <span className="font-mono text-[10px] font-medium text-text-inactive">
        {s.label}
      </span>
    </div>
  );
}

/** Non-open connection states get an inline banner above the input. */
function ConnectionBanner({
  status,
  onReconnect,
}: {
  status: ConnStatus;
  onReconnect: () => void;
}) {
  if (status === "open" || status === "connecting") return null;

  if (status === "offline") {
    return (
      <div className="flex items-center gap-2 border-t border-hairline bg-surface-muted px-3.5 py-2 text-text-body">
        <WifiOff className="size-[13px] flex-none" strokeWidth={2.2} />
        <span className="font-sans text-[11.5px] font-medium">
          You&rsquo;re offline — messages send when you reconnect.
        </span>
      </div>
    );
  }
  if (status === "reconnecting") {
    return (
      <div className="flex items-center gap-2 border-t border-forecast-border bg-coach-surface px-3.5 py-2 text-coach-text">
        <Loader2 className="size-[13px] flex-none animate-spin" strokeWidth={2.2} />
        <span className="font-sans text-[11.5px] font-medium">
          Reconnecting to Coach…
        </span>
      </div>
    );
  }
  // error
  return (
    <div className="flex items-center gap-2 border-t border-caution-border bg-caution-surface px-3.5 py-2 text-caution">
      <WifiOff className="size-[13px] flex-none" strokeWidth={2.2} />
      <span className="flex-1 font-sans text-[11.5px] font-medium">
        Connection lost.
      </span>
      <button
        type="button"
        onClick={onReconnect}
        className="flex items-center gap-1 rounded-[8px] bg-caution px-2 py-1 font-sans text-[11px] font-semibold text-white active:scale-95"
      >
        <RefreshCw className="size-3" strokeWidth={2.4} />
        Retry
      </button>
    </div>
  );
}

export function CoachPopover() {
  const open = useCoachUi((s) => s.open);
  const closeCoach = useCoachUi((s) => s.closeCoach);

  // Connect the socket on the first open and keep it alive afterwards. Latch
  // during render (not in an effect) so the first paint is already the open
  // popover — no extra commit, no initial-open flash.
  const [everOpened, setEverOpened] = useState(false);
  if (open && !everOpened) setEverOpened(true);

  const { messages, status, pending, send, retryMessage, reconnect } =
    useCoachSocket(everOpened);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Stick to the newest message as the thread + typing indicator grow.
  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, pending, status, open]);

  function submit() {
    if (!draft.trim()) return;
    send(draft);
    setDraft("");
  }

  if (!everOpened) return null;

  const offline = status === "offline";

  return (
    <>
      {/* Mobile scrim (desktop chatbot floats without dimming the page). */}
      <div
        aria-hidden={!open}
        onClick={closeCoach}
        className={cn(
          "fixed inset-0 z-50 bg-black/30 transition-opacity sm:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <section
        role="dialog"
        aria-label="Coach"
        aria-modal="true"
        className={cn(
          "fixed z-50 flex flex-col overflow-hidden bg-app-bg transition-all duration-200",
          // Mobile: full screen.
          "inset-0",
          // Desktop: floating chatbot card, bottom-right.
          "sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[min(620px,calc(100dvh-40px))] sm:w-[400px] sm:max-w-[calc(100vw-40px)] sm:rounded-[22px] sm:border sm:border-hairline sm:shadow-card",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0",
        )}
      >
        {/* header */}
        <header
          className="flex h-[var(--np-topbar-h)] flex-none items-center gap-3 border-b border-hairline bg-surface px-3.5 sm:h-[58px]"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <AiAvatar />
          <div className="flex-1">
            <div className="font-sans text-[16px] font-extrabold text-ink">Coach</div>
            <HeaderStatus status={status} />
          </div>
          <button
            type="button"
            onClick={closeCoach}
            aria-label="Close"
            className="flex size-[34px] items-center justify-center rounded-[10px] border border-control-border text-text-strong active:scale-95"
          >
            <X className="size-[17px]" strokeWidth={2} />
          </button>
        </header>

        {/* messages */}
        <div ref={scrollRef} className="no-scrollbar flex-1 overflow-y-auto p-4">
          {messages.length === 0 && status !== "connecting" && (
            <div className="mt-6 flex flex-col items-center gap-2 text-center">
              <AiAvatar />
              <p className="max-w-[240px] font-sans text-[13px] font-medium leading-[1.5] text-text-body">
                Ask about your plan, log progress, or get a safe suggestion for
                right now.
              </p>
            </div>
          )}

          {/* first-connect skeleton */}
          {messages.length === 0 && status === "connecting" && <ConnectSkeleton />}

          {messages.map((m) => (
            <Bubble key={m.id} msg={m} onSuggestion={send} onRetry={retryMessage} />
          ))}

          {pending && <TypingIndicator />}
        </div>

        {/* connection banner */}
        <ConnectionBanner status={status} onReconnect={reconnect} />

        {/* input bar */}
        <div
          className="flex flex-none items-center gap-2.5 border-t border-hairline bg-surface px-3.5 py-3"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom),12px)" }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={offline ? "Offline — will send later…" : "Ask anything…"}
            className="h-[42px] flex-1 rounded-[13px] bg-surface-muted px-3.5 font-sans text-[13px] font-medium text-ink outline-none placeholder:text-text-inactive"
          />
          <button
            type="button"
            onClick={submit}
            aria-label="Send"
            className="flex size-[42px] flex-none items-center justify-center rounded-[13px] bg-brand text-white active:scale-95 disabled:opacity-40"
            disabled={!draft.trim()}
          >
            <Send className="size-[19px]" strokeWidth={2} />
          </button>
        </div>
      </section>
    </>
  );
}

function Bubble({
  msg,
  onSuggestion,
  onRetry,
}: {
  msg: CoachMessage;
  onSuggestion: (text: string) => void;
  onRetry: (id: string) => void;
}) {
  if (msg.role === "user") {
    return (
      <div className="mb-3 flex flex-col items-end">
        <div className="max-w-[78%] rounded-[16px_16px_4px_16px] bg-brand px-3 py-2.5 font-sans text-[13.5px] font-medium leading-[1.4] text-white">
          {msg.text}
        </div>
        <SendReceipt status={msg.status} onRetry={() => onRetry(msg.id)} />
      </div>
    );
  }
  return (
    <div className="mb-3 flex gap-2">
      <AiAvatar />
      <div className="flex-1">
        <div className="rounded-[4px_16px_16px_16px] border border-hairline bg-surface px-3 py-2.5 font-sans text-[13.5px] font-medium leading-[1.45] text-text-strong">
          <Markdown text={msg.text} />
        </div>
        {msg.suggestions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {msg.suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSuggestion(s)}
                className="rounded-[9px] border border-hairline bg-brand-surface px-2.5 py-1.5 font-sans text-[11.5px] font-semibold text-brand active:scale-[0.98]"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Tiny per-message delivery line under an outgoing bubble. */
function SendReceipt({
  status,
  onRetry,
}: {
  status?: CoachMessage["status"];
  onRetry: () => void;
}) {
  if (!status || status === "sent") return null;
  const base = "mt-1 flex items-center gap-1 font-mono text-[9.5px] font-medium";
  if (status === "sending") {
    return (
      <span className={cn(base, "text-text-inactive")}>
        <Loader2 className="size-2.5 animate-spin" strokeWidth={2.4} /> Sending…
      </span>
    );
  }
  if (status === "queued") {
    return (
      <span className={cn(base, "text-text-inactive")}>
        <Clock className="size-2.5" strokeWidth={2.4} /> Waiting to send
      </span>
    );
  }
  // failed
  return (
    <button
      type="button"
      onClick={onRetry}
      className={cn(base, "text-caution active:scale-95")}
    >
      <RotateCcw className="size-2.5" strokeWidth={2.4} /> Failed · Retry
    </button>
  );
}

function TypingIndicator() {
  return (
    <div className="mb-3 flex gap-2">
      <AiAvatar />
      <div className="flex items-center gap-1 rounded-[4px_16px_16px_16px] border border-hairline bg-surface px-3 py-3">
        <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
      </div>
    </div>
  );
}

/** Shimmer placeholder while the very first connection is dialing. */
function ConnectSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="flex gap-2">
        <div className="size-[30px] flex-none rounded-[10px] bg-surface-muted" />
        <div className="h-[52px] w-[70%] rounded-[4px_16px_16px_16px] bg-surface-muted" />
      </div>
      <div className="flex justify-end">
        <div className="h-[40px] w-[55%] rounded-[16px_16px_4px_16px] bg-surface-muted" />
      </div>
    </div>
  );
}

function Dot({ delay = "0ms" }: { delay?: string }) {
  return (
    <span
      className="size-1.5 animate-bounce rounded-full bg-text-inactive"
      style={{ animationDelay: delay }}
    />
  );
}
