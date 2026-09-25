"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { BackHeader } from "@/components/chrome/back-header";
import { FlowScreen, FlowCTA } from "@/components/chrome/flow-screen";
import { OtpInput } from "@/components/np/otp-input";
import { useAuth } from "@/lib/auth/auth-context";
import { auth, ApiError, isAuthResult } from "@/lib/api";
import { routeAfterAuth } from "@/lib/auth/post-auth";

export default function VerifyPage() {
  const router = useRouter();
  const {
    pendingEmail,
    pendingSession,
    pendingChallenges,
    setPendingSession,
    markAuthenticated,
  } = useAuth();
  const [code, setCode] = useState("");
  const [secs, setSecs] = useState(24);
  const [busy, setBusy] = useState(false);

  // Reached without a started session → restart.
  useEffect(() => {
    if (!pendingEmail || !pendingSession) router.replace("/auth/email");
  }, [pendingEmail, pendingSession, router]);

  useEffect(() => {
    if (secs <= 0) return;
    const t = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs]);

  const showPasskey = pendingChallenges?.includes("WEB_AUTHN") ?? false;
  const showPassword = pendingChallenges?.includes("PASSWORD") ?? true;

  async function verify() {
    if (!pendingEmail || !pendingSession) return;
    if (code.length !== 8) return toast.error("Enter the 8-digit code.");

    setBusy(true);
    try {
      const step = await auth.respond({
        email: pendingEmail,
        session: pendingSession,
        challenge: "EMAIL_OTP",
        answer: code,
      });
      if (isAuthResult(step)) {
        markAuthenticated();
        router.replace(await routeAfterAuth());
      } else {
        // Unexpected further challenge — carry the new session forward.
        setPendingSession(step.session);
        toast("One more step needed.");
      }
    } catch (e) {
      const err = e instanceof ApiError ? e : null;
      if (err?.code === "AUTH_OTP_EXPIRED") {
        toast.error("Code expired — resend a new one.");
        setSecs(0);
      } else {
        toast.error(err?.message ?? "Invalid or expired code.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (!pendingEmail) return;
    try {
      const challenge = await auth.start(pendingEmail);
      setPendingSession(challenge.session);
      setSecs(24);
      setCode("");
      toast.success("New code sent.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not resend code.");
    }
  }

  return (
    <FlowScreen header={<BackHeader />} bodyClassName="flex flex-col px-7 py-4">
      <div className="mt-2 flex size-12 items-center justify-center rounded-[14px] bg-brand-surface text-brand">
        <Mail className="size-6" strokeWidth={1.8} />
      </div>
      <h1 className="mt-4 font-sans text-[25px] font-extrabold leading-[1.22] tracking-[-0.02em] text-ink">
        Check your email
      </h1>
      <p className="mt-2 font-sans text-[14px] font-medium leading-[1.5] text-[#7e867f]">
        We sent an 8-digit code to{" "}
        <b className="text-text-strong">{pendingEmail ?? "your email"}</b> ·{" "}
        <button onClick={() => router.replace("/auth/email")} className="font-semibold text-brand">
          Edit
        </button>
      </p>

      <div className="mt-6">
        <OtpInput length={8} value={code} onChange={setCode} />
      </div>

      <FlowCTA className="mt-5" onClick={busy ? undefined : verify}>
        {busy ? "Verifying…" : "Continue"}
      </FlowCTA>

      <div className="mt-4 text-center font-sans text-[13px] font-medium text-text-inactive">
        {secs > 0 ? (
          <>
            Didn&apos;t get it? Resend in{" "}
            <span className="font-mono font-semibold text-[#7e867f]">
              0:{secs.toString().padStart(2, "0")}
            </span>
          </>
        ) : (
          <button className="font-semibold text-brand" onClick={resend}>
            Resend code
          </button>
        )}
      </div>

      {/* more ways to sign in */}
      <div className="mt-auto pt-6">
        <div className="mb-3.5 flex items-center gap-3">
          <div className="h-px flex-1 bg-hairline" />
          <span className="font-mono text-[10.5px] font-semibold text-text-inactive">
            MORE WAYS TO SIGN IN
          </span>
          <div className="h-px flex-1 bg-hairline" />
        </div>
        <div className="flex gap-2.5">
          {showPasskey && (
            <button
              type="button"
              onClick={() => router.push("/auth/passkey")}
              className="flex h-[46px] flex-1 items-center justify-center gap-2 rounded-[13px] border-[1.5px] border-control-border bg-surface font-sans text-[13.5px] font-semibold text-text-strong active:scale-[0.99]"
            >
              <Fingerprint className="size-[18px] text-brand" strokeWidth={1.8} />
              Passkey
            </button>
          )}
          {showPassword && (
            <button
              type="button"
              onClick={() => router.push("/auth/password")}
              className="flex h-[46px] flex-1 items-center justify-center gap-2 rounded-[13px] border-[1.5px] border-control-border bg-surface font-sans text-[13.5px] font-semibold text-text-strong active:scale-[0.99]"
            >
              <Lock className="size-[17px] text-brand" strokeWidth={1.8} />
              Password
            </button>
          )}
        </div>
      </div>
    </FlowScreen>
  );
}
