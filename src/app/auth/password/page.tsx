"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { BackHeader } from "@/components/chrome/back-header";
import { FlowScreen, FlowCTA } from "@/components/chrome/flow-screen";
import { AuthField } from "@/components/np/auth-field";
import { useAuth } from "@/lib/auth/auth-context";
import { auth, ApiError, isAuthResult } from "@/lib/api";
import { routeAfterAuth } from "@/lib/auth/post-auth";

export default function PasswordPage() {
  const router = useRouter();
  const { pendingEmail, setPendingSession, markAuthenticated } = useAuth();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!pendingEmail) router.replace("/auth/email");
  }, [pendingEmail, router]);

  async function login() {
    if (!pendingEmail) return;
    if (!password) return toast.error("Enter your password.");

    setBusy(true);
    try {
      const step = await auth.passwordSignIn({ email: pendingEmail, password });
      if (isAuthResult(step)) {
        markAuthenticated();
        router.replace(await routeAfterAuth());
      } else {
        setPendingSession(step.session);
        toast("One more step needed.");
      }
    } catch (e) {
      const err = e instanceof ApiError ? e : null;
      if (err?.code === "AUTH_RESET_REQUIRED") {
        toast("Please reset your password to continue.");
        await forgot();
        return;
      }
      toast.error(err?.message ?? "Could not log in.");
    } finally {
      setBusy(false);
    }
  }

  async function forgot() {
    if (!pendingEmail) return;
    try {
      await auth.recover(pendingEmail);
      toast.success("Reset code sent.");
      router.push("/auth/reset-code");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not start reset.");
    }
  }

  async function emailCodeInstead() {
    if (!pendingEmail || sending) return;
    setSending(true);
    try {
      const challenge = await auth.start(pendingEmail);
      setPendingSession(challenge.session);
      router.replace("/auth/verify");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not send code.");
    } finally {
      setSending(false);
    }
  }

  return (
    <FlowScreen header={<BackHeader />} bodyClassName="px-7 py-4">
      {/* email chip */}
      <div className="mt-2 inline-flex items-center gap-2 rounded-full border-[1.5px] border-control-border bg-surface py-1.5 pl-3.5 pr-1.5">
        <Mail className="size-[17px] text-brand" strokeWidth={1.8} />
        <span className="font-sans text-[14px] font-semibold text-ink">
          {pendingEmail}
        </span>
        <button
          onClick={() => router.replace("/auth/email")}
          className="flex h-7 items-center rounded-full bg-[#eef2ef] px-2.5 font-sans text-[12px] font-semibold text-brand"
        >
          Edit
        </button>
      </div>

      <h1 className="mt-5 font-sans text-[25px] font-extrabold leading-[1.22] tracking-[-0.02em] text-ink">
        Enter your password
      </h1>
      <p className="mt-1.5 font-sans text-[13.5px] font-medium leading-[1.5] text-[#7e867f]">
        Welcome back — log in to pick up your plan.
      </p>

      <div className="mt-5">
        <AuthField
          label="Password"
          icon={<Lock strokeWidth={1.8} />}
          type="password"
          autoComplete="current-password"
          autoFocus
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") login();
          }}
        />
      </div>

      <div className="mt-3 text-right">
        <button onClick={forgot} className="font-sans text-[13px] font-semibold text-brand">
          Forgot password?
        </button>
      </div>

      <FlowCTA className="mt-4" onClick={busy ? undefined : login}>
        {busy ? "Logging in…" : "Log in"}
      </FlowCTA>

      <button
        onClick={emailCodeInstead}
        className="mt-3 flex h-[50px] w-full items-center justify-center font-sans text-[14px] font-semibold text-brand"
      >
        {sending ? "Sending…" : "Email me a code instead"}
      </button>
    </FlowScreen>
  );
}
