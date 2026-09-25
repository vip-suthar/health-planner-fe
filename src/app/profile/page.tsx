"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Bell,
  Leaf,
  LogOut,
  ShieldCheck,
  ShoppingBasket,
  Settings,
  Target,
  HeartPulse,
} from "lucide-react";
import { AppShell } from "@/components/chrome/app-shell";
import { TopBar, TopBarIconButton } from "@/components/chrome/top-bar";
import { ListGroup, ListRow } from "@/components/np/list-row";
import { SafetyChip } from "@/components/np/safety-chip";
import { StatusBadge } from "@/components/np/status-badge";
import { Eyebrow } from "@/components/np/typography";
import { profile as profileMock } from "@/lib/data";
import { useAuth } from "@/lib/auth/auth-context";
import useSWR from "swr";
import { useUser } from "@/lib/api/use-api";
import { data as dataApi } from "@/lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { data: user } = useUser();
  const { data: medical } = useSWR("/data/medical", () => dataApi.getMedical());

  const name = user?.name ?? profileMock.name;
  const email = user?.email ?? profileMock.email;
  const initial = (name?.[0] ?? "S").toUpperCase();
  const flags = (medical ?? []).map((m) => ({
    label: m.name,
    danger: m.type === "allergy",
  }));
  const safetyFlags = flags.length ? flags : [];
  const flagCount = (medical ?? []).filter((m) => m.type !== "medication").length;

  async function handleLogout() {
    await signOut();
    router.replace("/welcome");
  }

  const topBar = (
    <TopBar
      left={
        <span className="font-sans text-[17px] font-extrabold tracking-[-0.02em] text-ink">
          Profile
        </span>
      }
      right={
        <TopBarIconButton href="/settings" aria-label="Settings">
          <Settings className="size-4" strokeWidth={1.8} />
        </TopBarIconButton>
      }
    />
  );

  return (
    <AppShell topBar={topBar} fab={false}>
      {/* identity */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-[58px] items-center justify-center rounded-[18px] bg-movement font-sans text-[22px] font-extrabold text-[#9fd8bc]">
          {initial}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-sans text-[18px] font-extrabold text-ink">
              {name}
            </span>
          </div>
          <div className="mt-1.5 font-sans text-[12px] font-medium text-[#7e867f]">
            {email}
          </div>
        </div>
      </div>

      {/* safety summary */}
      <button
        type="button"
        onClick={() => router.push("/safety")}
        className="mb-4 w-full rounded-[18px] border-[1.5px] border-brand-border bg-surface p-4 text-left shadow-card-soft active:scale-[0.99]"
      >
        <div className="mb-3 flex items-center gap-2.5">
          <span className="flex size-[30px] items-center justify-center rounded-[9px] bg-brand-surface text-brand">
            <ShieldCheck className="size-4" strokeWidth={2} />
          </span>
          <div>
            <div className="font-sans text-[14px] font-bold text-ink">
              What we protect you from
            </div>
            <div className="mt-0.5 font-sans text-[11px] font-medium text-[#7e867f]">
              Active in every plan &amp; swap
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {safetyFlags.length ? (
            safetyFlags.map((f) => (
              <SafetyChip key={f.label} label={f.label} danger={f.danger} />
            ))
          ) : (
            <span className="font-sans text-[12px] font-medium text-text-inactive">
              No safety items added yet
            </span>
          )}
        </div>
        <div className="mt-3 font-sans text-[12px] font-semibold text-brand">
          Review safety summary →
        </div>
      </button>

      {/* health profile */}
      <Eyebrow className="mb-2.5 block tracking-[0.07em]">Health profile</Eyebrow>
      <ListGroup className="mb-3.5">
        <ListRow
          icon={<Target className="size-[18px]" strokeWidth={1.8} />}
          title="Goals & pace"
          trailing={
            <span className="font-sans text-[11px] font-medium text-text-inactive">
              Lose · steady
            </span>
          }
          onClick={() => router.push("/onboarding/preferences")}
        />
        <ListRow
          icon={<Leaf className="size-[18px]" strokeWidth={1.8} />}
          title="Dietary preferences"
          onClick={() => router.push("/onboarding/preferences")}
        />
        <ListRow
          icon={<HeartPulse className="size-[18px]" strokeWidth={1.8} />}
          title="Medical history"
          trailing={
            flagCount > 0 ? (
              <StatusBadge tone="caution">{flagCount} FLAGS</StatusBadge>
            ) : undefined
          }
          onClick={() => router.push("/safety")}
        />
      </ListGroup>

      {/* resources & settings */}
      <Eyebrow className="mb-2.5 block tracking-[0.07em]">Resources &amp; settings</Eyebrow>
      <ListGroup className="mb-3.5">
        <ListRow
          icon={<ShoppingBasket className="size-[18px]" strokeWidth={1.8} />}
          title="Kitchen & shopping"
          onClick={() => router.push("/kitchen")}
        />
        <ListRow
          icon={<Bell className="size-[18px]" strokeWidth={1.8} />}
          title="Notifications"
          onClick={() => toast("Notifications settings")}
        />
      </ListGroup>

      <button
        type="button"
        onClick={handleLogout}
        className="flex h-[46px] w-full items-center justify-center gap-2 rounded-[13px] border border-[#e6c9c7] font-sans text-[13px] font-bold text-[#9a3d38] active:scale-[0.99]"
      >
        <LogOut className="size-4" strokeWidth={1.9} />
        Log out
      </button>
    </AppShell>
  );
}
