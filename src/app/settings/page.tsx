"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { AppShell } from "@/components/chrome/app-shell";
import { BackHeader } from "@/components/chrome/back-header";
import { Eyebrow } from "@/components/np/typography";
import { useUser } from "@/lib/api/use-api";
import { data as dataApi, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth/auth-context";

const CONTROL_CLASS =
  "h-[50px] w-full rounded-[14px] border-[1.5px] border-control-border bg-surface px-3.5 font-sans text-[15px] font-medium text-ink outline-none transition-colors placeholder:text-text-inactive read-only:text-text-muted focus:border-brand focus:shadow-[0_0_0_3px_rgba(54,121,93,0.12)]";

function Field({
  label,
  value,
  onChange,
  type = "text",
  readOnly,
  placeholder,
  options,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  readOnly?: boolean;
  placeholder?: string;
  /** Renders a native select — use where the API validates against an enum. */
  options?: { value: string; label: string }[];
}) {
  return (
    <div>
      <Eyebrow className="mb-2 block tracking-[0.05em]">{label}</Eyebrow>
      {options ? (
        <select
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={CONTROL_CLASS}
        >
          <option value="">{placeholder ?? "Not set"}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          readOnly={readOnly}
          placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value)}
          className={CONTROL_CLASS}
        />
      )}
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { data: user, isLoading: loading, mutate: refetch } = useUser();

  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setGender(user.gender ?? "");
      setBirthdate(user.birthdate ?? "");
    }
  }, [user]);

  async function save() {
    setSaving(true);
    try {
      // Omit blanks: the API validates `gender` against an enum and `birthdate`
      // as a date, so sending "" for an unset field is a 422.
      await dataApi.updateUser({
        name: name.trim(),
        ...(gender ? { gender: gender as "male" | "female" | "other" } : {}),
        ...(birthdate ? { birthdate } : {}),
      });
      refetch(); // revalidate the shared /data/user cache (profile screen too)
      toast.success("Profile updated.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await signOut();
    router.replace("/welcome");
  }

  return (
    <AppShell topBar={<BackHeader title="Settings" />} fab={false} contentClassName="pb-8">
      <Eyebrow className="mb-2.5 block tracking-[0.07em]">Account</Eyebrow>
      <div className="mb-4 flex flex-col gap-3.5 rounded-2xl border border-hairline bg-surface p-4">
        <Field
          label="Email"
          value={loading ? "Loading…" : user?.email ?? ""}
          readOnly
        />
        <Field label="Full name" value={name} onChange={setName} placeholder="Your name" />
        <Field
          label="Gender"
          value={gender}
          onChange={setGender}
          options={[
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
            { value: "other", label: "Other" },
          ]}
        />
        <Field label="Birthdate" type="date" value={birthdate} onChange={setBirthdate} />
        <button
          type="button"
          onClick={saving ? undefined : save}
          className="mt-1 flex h-[48px] w-full items-center justify-center rounded-[14px] bg-brand font-sans text-[14px] font-bold text-white active:scale-[0.99]"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

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
