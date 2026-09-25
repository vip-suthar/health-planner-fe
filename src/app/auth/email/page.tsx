"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { BackHeader } from "@/components/chrome/back-header";
import { FlowScreen, FlowCTA } from "@/components/chrome/flow-screen";
import { AuthField } from "@/components/np/auth-field";
import { SocialAuth } from "@/components/np/social-auth";
import { useAuth } from "@/lib/auth/auth-context";
import { auth, ApiError } from "@/lib/api";

export default function EmailPage() {
  const router = useRouter();
  const { setPendingEmail, setPendingSession, setPendingChallenges } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const value = email.trim();
    if (!value) return toast.error("Enter your email.");

    setBusy(true);
    try {
      // Identifier-first: creates the account if new and emails a login code.
      const challenge = await auth.start(value);
      setPendingEmail(value);
      setPendingSession(challenge.session);
      setPendingChallenges(challenge.availableChallenges ?? null);
      router.push("/auth/verify");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not continue.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <FlowScreen header={<BackHeader />} bodyClassName="px-7 py-4">
      <div className="mt-2 flex size-12 items-center justify-center rounded-[14px] bg-brand-surface text-brand">
        <Mail className="size-6" strokeWidth={1.8} />
      </div>
      <h1 className="mt-4 font-sans text-[25px] font-extrabold leading-[1.22] tracking-[-0.02em] text-ink">
        Sign in to NutriPlan
      </h1>
      <p className="mt-1.5 font-sans text-[13.5px] font-medium leading-[1.5] text-[#7e867f]">
        Enter your email — we&apos;ll sign you in, or set you up if you&apos;re new.
      </p>

      <div className="mt-5">
        <AuthField
          label="Email address"
          icon={<Mail strokeWidth={1.8} />}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus
          placeholder="sam@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
      </div>

      <FlowCTA className="mt-4" onClick={busy ? undefined : submit}>
        {busy ? "Sending code…" : "Continue"}
      </FlowCTA>

      <SocialAuth />

      <p className="mt-6 text-center font-sans text-[11.5px] font-normal leading-[1.5] text-text-inactive">
        By continuing you agree to our{" "}
        <span className="text-text-strong">Terms</span> &amp;{" "}
        <span className="text-text-strong">Privacy Policy</span>.
      </p>
    </FlowScreen>
  );
}
