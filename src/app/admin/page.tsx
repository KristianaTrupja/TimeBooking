import { Suspense } from "react";
import AdminClient from "./AdminClient";
import { getSession } from "@/lib/userSession";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) {
    // Not signed in
    return redirect("/login");
  }

  // IMPORTANT: don't trust JWT role for authorization (it can be stale).
  // Always validate role from DB for admin gating.
  const dbUser = await db.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { role: true, isActive: true },
  });

  if (!dbUser?.isActive || dbUser.role.toLowerCase() !== "admin") {
    // Signed in, but not admin
    return redirect("/unauthorized");
  }
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminClient />
    </Suspense>
  );
}
