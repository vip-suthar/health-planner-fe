"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { BackHeader } from "@/components/chrome/back-header";
import { FlowScreen, FlowCTA } from "@/components/chrome/flow-screen";
import { OtpInput } from "@/components/np/otp-input";
import { useAuth } from "@/lib/auth/auth-context";
import { auth, ApiError } from "@/lib/api";

export default function ResetCodePage() {
  const router = useRouter();
  const { pendingEmail, setPendingCode } = useAuth();
  const [code, setCode] = useState("");
  const [secs, setSecs] = useState(24);

  // Reached without requesting a reset → restart.
  useEffect(() => {
    if (!pendingEmail) router.replace("/auth/email");
  }, [pendingEmail, router]);

  useEffect(() => {
    if (secs <= 0) return;
    const t = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs]);

  function next() {
    if (code.length !== 6) return toast.error("Enter the 6-digit code.");
    // recover/confirm verifies the code together with the new password (G7).
    setPendingCode(code);
    router.push("/auth/new-password");
  }

  async function resend() {
    if (!pendingEmail) return;
    try {
      await auth.recover(pendingEmail);
      setSecs(24);
      toast.success("New reset code sent.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not resend code.");
    }
  }

  return (
    <FlowScreen header={<BackHeader />} bodyClassName="px-7 py-4">
      <div className="mt-2 flex size-12 items-center justify-center rounded-[14px] bg-brand-surface text-brand">
        <KeyRound className="size-6" strokeWidth={1.7} />
      </div>
      <h1 className="mt-4 font-sans text-[25px] font-extrabold leading-[1.22] tracking-[-0.02em] text-ink">
        Enter your reset code
      </h1>
      <p className="mt-2 font-sans text-[14px] font-medium leading-[1.5] text-[#7e867f]">
        To reset your password we sent a 6-digit code to{" "}
        <b className="text-text-strong">{pendingEmail ?? "your email"}</b> ·{" "}
        <button onClick={() => router.replace("/auth/email")} className="font-semibold text-brand">
          Edit
        </button>
      </p>

      <div className="mt-6">
        <OtpInput value={code} onChange={setCode} />
      </div>

      <FlowCTA className="mt-5" onClick={next}>
        Verify &amp; set new password
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

      <div className="mt-4 flex items-center justify-center gap-2 rounded-[11px] border border-caution-border bg-[#fbf4ec] px-3 py-2.5">
        <TriangleAlert className="size-3.5 flex-none text-[#9a6b2e]" strokeWidth={2} />
        <span className="font-sans text-[11.5px] font-medium leading-[1.4] text-[#6b4e25]">
          This code is only for resetting your password.
        </span>
      </div>

      <p className="mt-5 text-center">
        <button
          onClick={() => router.replace("/auth/password")}
          className="font-sans text-[13.5px] font-semibold text-brand"
        >
          Back to log in
        </button>
      </p>
    </FlowScreen>
  );
}
