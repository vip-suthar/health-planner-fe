"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "./auth-context";

/**
 * Client guard for authenticated tab screens. Redirects to the welcome flow when
 * no tokens are present. Renders nothing while hydrating or redirecting to avoid
 * flashing protected content.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/welcome");
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div className="flex h-dvh items-center justify-center bg-app-bg">
        <Loader2 className="size-8 animate-spin text-brand" aria-label="Loading" />
      </div>
    );
  }
  return <>{children}</>;
}
