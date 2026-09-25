"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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

  if (status !== "authenticated") return null;
  return <>{children}</>;
}
