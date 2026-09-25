"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bell, Check, Sparkles, TriangleAlert, X } from "lucide-react";
import { data as dataApi, ApiError } from "@/lib/api";

const R = 38;
const CIRC = 2 * Math.PI * R;

const POLL_MS = 4000;
/** ~3 minutes — generation is a queued worker, not an inline call. */
const MAX_POLLS = 45;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function GeneratingPage() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // No "started" ref: the cleanup flag is what makes this safe, and it keeps
    // the effect correct under StrictMode's double-invoke (the first run bails
    // on its own `cancelled`, the second one drives the real navigation).
    let cancelled = false;

    (async () => {
      try {
        // Reading today's plan is what queues generation — there is no create
        // route. 200 means a plan already exists; 202 means it's being built.
        const first = await dataApi.getPlanToday();
        if (cancelled) return;
        if (first.state === "ready") {
          router.replace("/");
          return;
        }

        for (let i = 0; i < MAX_POLLS; i++) {
          await sleep(POLL_MS);
          if (cancelled) return;
          const { status } = await dataApi.getPlanStatus();
          if (cancelled) return;
          if (status === "completed") {
            router.replace("/");
            return;
          }
          if (status === "failed") break;
        }
        setFailed(true);
      } catch (e) {
        if (cancelled) return;
        // 422 — preferences were never saved, so no plan can be built.
        if (e instanceof ApiError && e.status === 422) {
          router.replace("/onboarding/preferences");
          return;
        }
        setFailed(true);
        toast.error(
          e instanceof ApiError ? e.message : "Could not build your plan.",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="relative mx-auto flex h-[100dvh] w-full max-w-[440px] flex-col items-center justify-center bg-app-bg px-8 text-center">
      <div className="relative mb-5 size-[88px]">
        <svg width="88" height="88" viewBox="0 0 88 88" className={failed ? undefined : "animate-spin animation-duration-[1.4s]"}>
          <circle cx="44" cy="44" r={R} fill="none" className="stroke-track" strokeWidth="7" />
          <circle
            cx="44"
            cy="44"
            r={R}
            fill="none"
            className={failed ? "stroke-caution-border" : "stroke-brand"}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={failed ? undefined : CIRC}
            strokeDashoffset={failed ? undefined : CIRC * 0.4}
            transform="rotate(-90 44 44)"
          />
        </svg>
        <div
          className={`absolute inset-0 flex items-center justify-center ${failed ? "text-caution" : "text-brand"}`}
        >
          {failed ? (
            <TriangleAlert className="size-7" strokeWidth={2.2} />
          ) : (
            <Sparkles className="size-7 fill-brand" />
          )}
        </div>
      </div>

      <h1 className="mb-2 font-sans text-[21px] font-extrabold leading-[1.25] text-ink">
        {failed ? "Couldn't build your plan" : "Building your week"}
      </h1>
      <p className="mb-5 max-w-[280px] font-sans text-[13.5px] font-medium leading-[1.5] text-[#7e867f]">
        {failed
          ? "Something went wrong generating your plan. Try again, or skip for now."
          : "Balancing your goals, safety bounds, and what's in your kitchen. About 20 seconds."}
      </p>

      <div className="mb-6 flex w-full max-w-[260px] flex-col gap-3">
        {["Checked your safety profile", "Matched your goals & pace"].map((t) => (
          <div key={t} className="flex items-center gap-2.5">
            <Check className="size-4 text-brand" strokeWidth={2.6} />
            <span className="font-sans text-[13px] font-semibold text-text-strong">{t}</span>
          </div>
        ))}
        <div className="flex items-center gap-2.5">
          {failed ? (
            <X className="size-4 text-caution" strokeWidth={2.6} />
          ) : (
            <span className="size-4 animate-spin rounded-full border-2 border-[#c2cac5] border-t-brand" />
          )}
          <span
            className={`font-sans text-[13px] font-semibold ${failed ? "text-caution" : "text-[#7e867f]"}`}
          >
            {failed ? "Drafting meals & activities — failed" : "Drafting meals & activities…"}
          </span>
        </div>
      </div>

      {failed ? (
        <div className="flex flex-col items-center gap-2.5">
          <button
            type="button"
            onClick={() => location.reload()}
            className="flex h-[46px] items-center justify-center gap-2 rounded-[14px] bg-brand px-6 font-sans text-[13px] font-bold text-white active:scale-[0.98]"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => router.replace("/")}
            className="font-sans text-[13px] font-semibold text-text-strong"
          >
            Skip for now
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex h-[46px] items-center gap-2 rounded-[14px] border border-control-border bg-surface px-5 font-sans text-[13px] font-semibold text-text-strong active:scale-[0.98]"
        >
          <Bell className="size-[15px]" strokeWidth={1.8} />
          Leave — notify me when ready
        </button>
      )}
    </div>
  );
}
