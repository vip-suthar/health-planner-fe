"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint, Mail } from "lucide-react";
import { toast } from "sonner";
import { BackHeader } from "@/components/chrome/back-header";
import { FlowScreen, FlowCTA } from "@/components/chrome/flow-screen";
import { useAuth } from "@/lib/auth/auth-context";
import { auth, ApiError } from "@/lib/api";

export default function PasskeyPage() {
  const router = useRouter();
  const { pendingEmail, setPendingSession } = useAuth();
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!pendingEmail) router.replace("/auth/email");
  }, [pendingEmail, router]);

  // WebAuthn enrolment isn't live yet — treat passkey as coming soon.
  function usePasskey() {
    toast("Passkey sign-in is coming soon.");
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
    <FlowScreen header={<BackHeader />} bodyClassName="flex flex-col px-7 py-4">
      {/* email chip */}
      <div className="mt-2 inline-flex items-center gap-2 rounded-full border-[1.5px] border-control-border bg-surface py-1.5 pl-3.5 pr-1.5">
        <Mail className="size-[17px] text-brand" strokeWidth={1.8} />
        <span className="font-sans text-[14px] font-semibold text-ink">{pendingEmail}</span>
        <button
          onClick={() => router.replace("/auth/email")}
          className="flex h-7 items-center rounded-full bg-[#eef2ef] px-2.5 font-sans text-[12px] font-semibold text-brand"
        >
          Edit
        </button>
      </div>

      <h1 className="mt-5 font-sans text-[25px] font-extrabold leading-[1.22] tracking-[-0.02em] text-ink">
        Use your passkey
      </h1>
      <p className="mt-2 font-sans text-[13.5px] font-medium leading-[1.5] text-[#7e867f]">
        Confirm it&apos;s you with Face ID or your fingerprint — nothing to type.
      </p>

      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="flex size-[118px] items-center justify-center rounded-[34px] bg-brand-surface text-brand">
          <Fingerprint className="size-[58px]" strokeWidth={1.5} />
        </div>
        <div className="flex items-center gap-2 font-sans text-[12.5px] font-semibold text-text-inactive">
          <span className="size-[7px] rounded-full bg-text-inactive" />
          Coming soon
        </div>
      </div>

      <FlowCTA onClick={usePasskey}>Continue with passkey</FlowCTA>
      <button
        onClick={emailCodeInstead}
        className="mt-1 flex h-[50px] w-full items-center justify-center font-sans text-[14px] font-semibold text-brand"
      >
        {sending ? "Sending…" : "Email me a code instead"}
      </button>
    </FlowScreen>
  );
}
