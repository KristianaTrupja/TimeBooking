"use client";

import { useSession } from "next-auth/react";

/**
 * Forces the current session to refresh from the database
 */
export function useRefreshSession() {
  const { update } = useSession();

  const refreshSession = async () => {
    // Trigger the JWT callback with trigger: "update"
    await update();
  };

  return refreshSession;
}
