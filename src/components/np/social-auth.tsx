"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { auth, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth/auth-context";
import { routeAfterAuth } from "@/lib/auth/post-auth";
import { isGoogleConfigured, renderGoogleButton } from "@/lib/auth/google";

/** OR divider + Google/Apple shortcuts (G2). Google uses GIS's own rendered
 *  button (overlaid transparently on the styled one) so a cancelled FedCM prompt
 *  never leaves the button stuck — busy is set only during the /auth/social call.
 *  Apple stays a stub until the native provider SDK is wired. */
export function SocialAuth() {
  const router = useRouter();
  const { markAuthenticated } = useAuth();
  const wrapRef = useRef<HTMLDivElement>(null);
  const gbtnRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const configured = isGoogleConfigured();

  useEffect(() => {
    const wrap = wrapRef.current;
    const host = gbtnRef.current;
    if (!configured || !wrap || !host) return;

    async function onCredential(idToken: string) {
      setBusy(true);
      try {
        await auth.social({ provider: "google", idToken });
        markAuthenticated();
        router.replace(await routeAfterAuth());
      } catch (e) {
        toast.error(e instanceof ApiError ? e.message : "Google sign-in failed.");
      } finally {
        setBusy(false);
      }
    }

    renderGoogleButton(host, onCredential, wrap.clientWidth).catch(() => {
      /* leaves the styled fallback button visible */
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured]);

  return (
    <>
      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-hairline" />
        <span className="font-mono text-[11px] font-semibold text-text-inactive">OR</span>
        <div className="h-px flex-1 bg-hairline" />
      </div>
      <div className="flex flex-col gap-2.5">
        {/* Google — styled button with the real GIS button overlaid transparently */}
        <div ref={wrapRef} className="relative">
          <button
            type="button"
            onClick={configured ? undefined : () => toast("Google sign-in isn't configured.")}
            disabled={busy}
            className="flex h-[50px] w-full items-center justify-center gap-2.5 rounded-[14px] border-[1.5px] border-control-border bg-surface font-sans text-[14.5px] font-semibold text-ink active:scale-[0.99] disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.6z" />
              <path fill="#34A853" d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.4 1.1-3.9 1.1-3 0-5.5-2-6.4-4.8H1.8v3C3.7 21.4 7.5 24 12 24z" />
              <path fill="#FBBC05" d="M5.6 14.6a7.2 7.2 0 0 1 0-4.6V7H1.8a12 12 0 0 0 0 10.6l3.8-3z" />
              <path fill="#EA4335" d="M12 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.2 15.1 0 12 0 7.5 0 3.7 2.6 1.8 6.4l3.8 3C6.5 6.7 9 4.8 12 4.8z" />
            </svg>
            {busy ? "Signing in…" : "Continue with Google"}
          </button>
          {configured && (
            <div
              ref={gbtnRef}
              aria-hidden
              className="absolute inset-0 flex items-center justify-center overflow-hidden opacity-0"
              style={{ pointerEvents: busy ? "none" : "auto" }}
            />
          )}
        </div>

        {/* <button
          type="button"
          onClick={() => toast("Apple sign-in is coming soon.")}
          className="flex h-[50px] items-center justify-center gap-2.5 rounded-[14px] border-[1.5px] border-ink bg-ink font-sans text-[14.5px] font-semibold text-white active:scale-[0.99]"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="#fff" aria-hidden>
            <path d="M16.4 12.7c0-2.2 1.8-3.3 1.9-3.3-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.4.8-.7 0-1.8-.8-2.9-.8-1.5 0-2.9.9-3.6 2.2-1.6 2.7-.4 6.7 1.1 8.9.7 1.1 1.6 2.3 2.7 2.2 1.1 0 1.5-.7 2.8-.7 1.3 0 1.6.7 2.8.7 1.2 0 1.9-1.1 2.6-2.1.8-1.2 1.2-2.4 1.2-2.4-.1 0-2.3-.9-2.3-3.5zM14.2 6.3c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.6.6-1.1 1.6-.9 2.6 1 0 2-.5 2.6-1.2z" />
          </svg>
          Continue with Apple
        </button> */}
      </div>
    </>
  );
}
