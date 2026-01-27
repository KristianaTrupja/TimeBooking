"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Hook to protect against invalid sessions
 * Automatically redirects to login if session becomes invalid
 * (e.g., user deactivated or role changed)
 */
export function useSessionGuard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // If session is explicitly null (not just loading), redirect to login
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  return { session, status };
}
