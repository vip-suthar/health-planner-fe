"use client";

import { useRouter } from "next/navigation";
import { Calendar, Shield, Sparkles } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";

const PROPS = [
  {
    icon: <Calendar className="size-[19px]" strokeWidth={1.9} />,
    title: "A living forecast",
    body: "Re-plans as you log — never the same week twice.",
  },
  {
    icon: <Shield className="size-[19px]" strokeWidth={1.9} />,
    title: "Safe by design",
    body: "Allergies & conditions respected on every plate.",
  },
  {
    icon: <Sparkles className="size-[18px] fill-brand" />,
    title: "A coach in your pocket",
    body: 'Ask "what can I eat now?" — answer in seconds.',
  },
];

export default function WelcomePage() {
  const router = useRouter();
  return (
    <div
      className="relative mx-auto flex h-[100dvh] w-full max-w-[440px] flex-col bg-app-bg px-7 pt-8"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom),26px)" }}
    >
      {/* brand */}
      <div className="mt-9 flex flex-col items-center">
        <div className="mb-3.5 flex size-14 items-center justify-center rounded-[18px] bg-brand text-white">
          <LogoMark size={30} />
        </div>
        <span className="font-sans text-[24px] font-extrabold tracking-[-0.02em] text-ink">
          NutriPlan
        </span>
      </div>

      {/* headline + props */}
      <div className="my-auto">
        <h1 className="text-center font-sans text-[26px] font-extrabold leading-[1.22] tracking-[-0.02em] text-ink">
          A plan that bends
          <br />
          to your week
        </h1>
        <p className="mx-auto mt-2.5 max-w-[300px] text-center font-sans text-[14px] font-medium leading-[1.55] text-[#7e867f]">
          Eat, move and feel better — safely, and without the rigid meal plans.
        </p>
        <div className="mt-6 flex flex-col gap-3.5">
          {PROPS.map((p) => (
            <div key={p.title} className="flex items-center gap-3.5">
              <div className="flex size-10 flex-none items-center justify-center rounded-[12px] bg-brand-surface text-brand">
                {p.icon}
              </div>
              <div>
                <div className="font-sans text-[14px] font-bold leading-[1.2] text-ink">
                  {p.title}
                </div>
                <div className="mt-0.5 font-sans text-[12px] font-medium leading-[1.3] text-[#7e867f]">
                  {p.body}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* buttons */}
      <div>
        <button
          type="button"
          onClick={() => router.push("/auth/email")}
          className="flex h-[52px] w-full items-center justify-center rounded-[15px] bg-brand font-sans text-[15px] font-bold text-white active:scale-[0.99]"
        >
          Get started
        </button>
        <p className="mt-3.5 text-center font-sans text-[12.5px] font-medium leading-[1.4] text-text-inactive">
          Sign in or create an account — it&apos;s the same door.
        </p>
      </div>
    </div>
  );
}
