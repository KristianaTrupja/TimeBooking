import { Suspense } from "react";
import AdminClient from "./AdminClient";
import { getSession } from "@/lib/userSession";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) {
    // Not signed in
    return redirect("/login");
  }

  if (session.user.role.toLowerCase() !== "admin") {
    // Signed in, but not admin
    return redirect("/unauthorized");
  }
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminClient />
    </Suspense>
  );
}
