"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Lock } from "lucide-react";
import { toast } from "sonner";
import { BackHeader } from "@/components/chrome/back-header";
import { FlowScreen, FlowCTA } from "@/components/chrome/flow-screen";
import { AuthField } from "@/components/np/auth-field";
import { useAuth } from "@/lib/auth/auth-context";
import { auth, ApiError, isAuthResult } from "@/lib/api";
import { routeAfterAuth } from "@/lib/auth/post-auth";
import { cn } from "@/lib/utils";

function Rule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "flex size-4 flex-none items-center justify-center rounded-full text-white",
          ok ? "bg-brand" : "bg-border-strong",
        )}
      >
        {ok && <Check className="size-2.5" strokeWidth={3.5} />}
      </span>
      <span
        className={cn(
          "font-sans text-[12px] font-medium leading-[1.3]",
          ok ? "text-text-strong" : "text-text-inactive",
        )}
      >
        {label}
      </span>
    </div>
  );
}

export default function NewPasswordPage() {
  const router = useRouter();
  const { pendingEmail, pendingCode, setPendingCode, markAuthenticated } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!pendingEmail || !pendingCode) router.replace("/auth/email");
  }, [pendingEmail, pendingCode, router]);

  // Policy: 8–256 chars, lower, upper, number, symbol (! @ # $ % ^ & *).
  const longEnough = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSymbol = /[!@#$%^&*]/.test(password);
  const matches = password.length > 0 && password === confirm;
  const valid = longEnough && hasNumber && hasUpper && hasLower && hasSymbol && matches;

  async function submit() {
    if (!pendingEmail || !pendingCode) return;
    if (!valid) return toast.error("Password doesn't meet the requirements.");

    setBusy(true);
    try {
      await auth.recoverConfirm({
        email: pendingEmail,
        code: pendingCode,
        newPassword: password,
      });
      setPendingCode(null);
      // Sign in with the new password so the user lands straight in the app.
      try {
        const step = await auth.passwordSignIn({ email: pendingEmail, password });
        if (isAuthResult(step)) {
          markAuthenticated();
          router.replace(await routeAfterAuth());
          return;
        }
      } catch {
        /* fall through to manual sign-in */
      }
      toast.success("Password reset — sign in to continue.");
      router.replace("/auth/password");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not reset password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <FlowScreen header={<BackHeader />} bodyClassName="px-7 py-4">
      <div className="mt-2 flex size-12 items-center justify-center rounded-[14px] bg-brand-surface text-brand">
        <Lock className="size-6" strokeWidth={1.8} />
      </div>
      <h1 className="mt-4 font-sans text-[25px] font-extrabold leading-[1.22] tracking-[-0.02em] text-ink">
        Set a new password
      </h1>
      <p className="mt-2 font-sans text-[14px] font-medium leading-[1.5] text-[#7e867f]">
        Code verified for <b className="text-text-strong">{pendingEmail}</b>. Choose a new password.
      </p>

      <div className="mt-5">
        <AuthField
          label="New password"
          icon={<Lock strokeWidth={1.8} />}
          type="password"
          autoComplete="new-password"
          autoFocus
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <AuthField
          label="Confirm password"
          icon={<Lock strokeWidth={1.8} />}
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        <Rule ok={longEnough} label="At least 8 characters" />
        <Rule ok={hasUpper && hasLower} label="Upper & lowercase letters" />
        <Rule ok={hasNumber} label="Contains a number" />
        <Rule ok={hasSymbol} label="A symbol (! @ # $ % ^ & *)" />
        <Rule ok={matches} label="Both passwords match" />
      </div>

      <FlowCTA className="mt-5" onClick={busy ? undefined : submit}>
        {busy ? "Resetting…" : "Reset password"}
      </FlowCTA>
    </FlowScreen>
  );
}
