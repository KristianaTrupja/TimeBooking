"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Monitors session changes and handles auto-logout
 * Place this component at the root layout level
 */
export function SessionMonitor() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const previousRoleRef = useRef<string | null>(null);

  useEffect(() => {
    // Store initial role
    if (session?.user?.role && !previousRoleRef.current) {
      previousRoleRef.current = session.user.role;
    }

    // Check if role has changed (triggered by admin)
    if (session?.user?.role && previousRoleRef.current && 
        session.user.role !== previousRoleRef.current) {
      previousRoleRef.current = session.user.role;
      
      // Redirect to appropriate dashboard based on new role
      if (session.user.role === "Admin") {
        router.push("/admin");
      } else {
        router.push(`/developer/${session.user.id}`);
      }
      router.refresh();
    }

    // If session becomes unauthenticated, redirect to login
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [session, status, router]);

  // Periodically trigger session update to check for changes
  // Adjust REFRESH_INTERVAL based on your needs:
  // - 60000 (1 min) = Good balance for most apps
  // - 300000 (5 min) = Better performance, slower updates
  // - 30000 (30 sec) = Faster updates, more DB load
  const REFRESH_INTERVAL = 60000; // 1 minute (recommended)

  useEffect(() => {
    if (status === "authenticated") {
      const interval = setInterval(() => {
        update(); // Triggers JWT callback to refresh from DB
      }, REFRESH_INTERVAL);

      return () => clearInterval(interval);
    }
  }, [status, update]);

  return null; // This component doesn't render anything
}
