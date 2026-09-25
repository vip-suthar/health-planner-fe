"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getTokens } from "@/lib/auth/auth-context";
import { COACH_WS_URL } from "./config";

/**
 * API Gateway authorizes the connection off `?token=<accessToken>` on the wss
 * URL — the same Cognito access token the REST routes take as a Bearer.
 */
function socketUrl(): string {
  const accessToken = getTokens()?.accessToken;
  if (!accessToken) return COACH_WS_URL;
  const sep = COACH_WS_URL.includes("?") ? "&" : "?";
  return `${COACH_WS_URL}${sep}token=${encodeURIComponent(accessToken)}`;
}

export type CoachRole = "assistant" | "user" | "system";

/** Live socket lifecycle, surfaced in the header + connection banner. */
export type ConnStatus =
  | "connecting" // first dial, no prior success
  | "open" // socket ready
  | "reconnecting" // dropped, backing off toward a retry
  | "offline" // browser reports no network — we don't even dial
  | "error"; // gave up after MAX_RETRIES; needs a manual retry

/** Per-user-message delivery state (assistant messages have none). */
export type SendStatus = "queued" | "sending" | "sent" | "failed";

export interface CoachMessage {
  id: string;
  role: CoachRole;
  /** `coach.suggestion` payloads render as a card; plain `message` as a bubble. */
  kind: "message" | "coach.suggestion";
  text: string;
  /** Quick-reply chips the assistant offered with this message. */
  suggestions: string[];
  timestamp: string;
  /** Only set on outgoing user messages. */
  status?: SendStatus;
}

/** Wire payload — both directions share this envelope (see task spec). */
interface CoachEnvelope {
  type: "message" | "coach.suggestion";
  message: {
    role: CoachRole;
    content: { message: string; suggestions?: string[] };
  };
  timestamp: string;
}

const MAX_RETRIES = 6;
/** Drop the typing indicator if the assistant never answers. */
const REPLY_TIMEOUT_MS = 25_000;

const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const isOnline = () =>
  typeof navigator === "undefined" ? true : navigator.onLine;

function envelope(text: string, now: string): string {
  // `action` selects the API Gateway route; the body mirrors the inbound shape
  // so the backend reads user turns the same way it emits assistant ones.
  return JSON.stringify({
    action: "message",
    type: "message",
    message: { role: "user", content: { message: text } },
    timestamp: now,
  });
}

function parse(raw: string): CoachMessage | null {
  try {
    const env = JSON.parse(raw) as Partial<CoachEnvelope>;
    const content = env.message?.content;
    if (!content || typeof content.message !== "string") return null;
    return {
      id: uid(),
      role: env.message?.role ?? "assistant",
      kind: env.type === "coach.suggestion" ? "coach.suggestion" : "message",
      text: content.message,
      suggestions: Array.isArray(content.suggestions) ? content.suggestions : [],
      timestamp: env.timestamp ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export interface CoachSocket {
  messages: CoachMessage[];
  status: ConnStatus;
  /** Assistant turn is in flight (drives the typing indicator). */
  pending: boolean;
  send: (text: string) => void;
  /** Re-send a single failed/queued user message. */
  retryMessage: (id: string) => void;
  /** User-initiated reconnect from the error state. */
  reconnect: () => void;
}

/**
 * Owns the Coach WebSocket + all of its edge states:
 *  - lazy connect on first `enabled`, kept alive across popover close/reopen
 *  - exponential-backoff reconnect, then a terminal `error` state with manual retry
 *  - browser online/offline awareness (no pointless dialing while offline)
 *  - an outbox: messages typed while disconnected queue and replay on reconnect
 *  - per-message send status + a reply timeout for the typing indicator
 */
export function useCoachSocket(enabled: boolean): CoachSocket {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [status, setStatus] = useState<ConnStatus>("connecting");
  const [pending, setPending] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const backoffTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closedByUs = useRef(false);
  /** Queued user messages (id + text) awaiting an open socket. */
  const outbox = useRef<{ id: string; text: string }[]>([]);
  /** Latest messages, readable outside the render cycle (retryMessage). */
  const messagesRef = useRef<CoachMessage[]>([]);
  messagesRef.current = messages;

  const setStatusFor = useCallback((s: SendStatus, id: string) => {
    setMessages((m) => m.map((x) => (x.id === id ? { ...x, status: s } : x)));
  }, []);

  const armReplyTimeout = useCallback(() => {
    if (replyTimer.current) clearTimeout(replyTimer.current);
    setPending(true);
    replyTimer.current = setTimeout(() => setPending(false), REPLY_TIMEOUT_MS);
  }, []);

  /** Push everything buffered while disconnected, marking each sent. */
  const flushOutbox = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || outbox.current.length === 0)
      return;
    const items = outbox.current;
    outbox.current = [];
    const now = new Date().toISOString();
    for (const it of items) {
      try {
        ws.send(envelope(it.text, now));
        setStatusFor("sent", it.id);
      } catch {
        outbox.current.push(it);
        setStatusFor("failed", it.id);
      }
    }
    if (items.length) armReplyTimeout();
  }, [armReplyTimeout, setStatusFor]);

  const connect = useCallback(() => {
    if (wsRef.current || typeof window === "undefined") return;
    if (!isOnline()) {
      setStatus("offline");
      return;
    }
    setStatus(retryRef.current > 0 ? "reconnecting" : "connecting");
    let ws: WebSocket;
    try {
      ws = new WebSocket(socketUrl());
    } catch {
      setStatus("error");
      return;
    }
    wsRef.current = ws;

    ws.onopen = () => {
      retryRef.current = 0;
      setStatus("open");
      flushOutbox();
    };
    ws.onmessage = (e) => {
      const msg = parse(typeof e.data === "string" ? e.data : "");
      if (!msg) return;
      if (replyTimer.current) clearTimeout(replyTimer.current);
      setPending(false);
      setMessages((m) => [...m, msg]);
    };
    ws.onerror = () => {
      // onclose fires next; reconnection is decided there.
    };
    ws.onclose = () => {
      wsRef.current = null;
      setPending(false);
      if (replyTimer.current) clearTimeout(replyTimer.current);
      if (closedByUs.current) return;
      if (!isOnline()) {
        setStatus("offline");
        return;
      }
      if (retryRef.current >= MAX_RETRIES) {
        setStatus("error");
        return;
      }
      const delay = Math.min(1000 * 2 ** retryRef.current, 10_000);
      retryRef.current += 1;
      setStatus("reconnecting");
      backoffTimer.current = setTimeout(connect, delay);
    };
  }, [flushOutbox]);

  // Lazy connect once enabled; tear down for real only on unmount.
  useEffect(() => {
    if (!enabled) return;
    closedByUs.current = false;
    connect();
    return () => {
      closedByUs.current = true;
      if (backoffTimer.current) clearTimeout(backoffTimer.current);
      if (replyTimer.current) clearTimeout(replyTimer.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [enabled, connect]);

  // React to the browser losing / regaining the network.
  useEffect(() => {
    if (!enabled) return;
    const onOnline = () => {
      retryRef.current = 0;
      connect(); // no-op if a socket already exists
    };
    const onOffline = () => {
      setStatus("offline");
      if (backoffTimer.current) clearTimeout(backoffTimer.current);
      wsRef.current?.close();
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [enabled, connect]);

  /** Try to push `text` now; otherwise queue it. Returns the resolved status. */
  const dispatch = useCallback(
    (id: string, text: string): SendStatus => {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(envelope(text, new Date().toISOString()));
          armReplyTimeout();
          return "sent";
        } catch {
          return "failed";
        }
      }
      // No live socket: buffer it and make sure a (re)connect is in flight.
      outbox.current.push({ id, text });
      if (isOnline()) connect();
      else setStatus("offline");
      return "queued";
    },
    [armReplyTimeout, connect],
  );

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const id = uid();
      const now = new Date().toISOString();
      setMessages((m) => [
        ...m,
        {
          id,
          role: "user",
          kind: "message",
          text: trimmed,
          suggestions: [],
          timestamp: now,
          status: "sending",
        },
      ]);
      const resolved = dispatch(id, trimmed);
      if (resolved !== "sending") setStatusFor(resolved, id);
    },
    [dispatch, setStatusFor],
  );

  const retryMessage = useCallback(
    (id: string) => {
      const msg = messagesRef.current.find((x) => x.id === id);
      if (!msg || msg.role !== "user") return;
      // Drop any stale outbox copy so a flush doesn't double-send.
      outbox.current = outbox.current.filter((x) => x.id !== id);
      setStatusFor("sending", id);
      const resolved = dispatch(id, msg.text);
      if (resolved !== "sending") setStatusFor(resolved, id);
    },
    [dispatch, setStatusFor],
  );

  const reconnect = useCallback(() => {
    retryRef.current = 0;
    if (backoffTimer.current) clearTimeout(backoffTimer.current);
    connect();
  }, [connect]);

  return { messages, status, pending, send, retryMessage, reconnect };
}
