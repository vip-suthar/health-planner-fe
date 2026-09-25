"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { FlowScreen } from "./flow-screen";
import { Button } from "@/components/ui/button";
import { Progress } from "../ui/progress";

export function OnboardingShell({
  step,
  total = 2,
  cta,
  back,
  children,
}: {
  step: number;
  total?: number;
  cta: React.ReactNode;
  back?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <FlowScreen
      header={
        <header
          className="flex h-(--np-topbar-h) items-center gap-3 border-b border-hairline bg-app-bg px-3.5"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <Button
            variant="outline"
            size="icon"
            onClick={() => (back ? router.push(back) : router.back())}
            aria-label="Back"
            className="rounded-md"
          >
            <ChevronLeft className="size-4" strokeWidth={2} />
          </Button>
          <Progress value={(step / total) * 100} className="flex-1" />
          <span className="font-mono text-[11px] font-semibold text-[#7e867f]">
            {step}/{total}
          </span>
        </header>
      }
      footer={cta}
      bodyClassName="py-5"
    >
      <div className="mt-4">{children}</div>
    </FlowScreen>
  );
}
