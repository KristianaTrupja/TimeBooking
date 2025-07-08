import { Suspense } from "react";
import Sidebar from "./layout/Sidebar";
import TopNavBar from "./layout/TopNavBar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SignOutButton from "../developer/components/signoutbutton/SignOutButton";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
 
  const session = await getServerSession(authOptions);

  return (
    <section
      className="2xl:mx-40 pt-11 min-h-screen"
      style={{ fontFamily: "var(--font-anek-bangla)" }}
    >
      <div className="flex justify-between mb-6 items-center">
        <h2
          className="text-4xl sm:text-6xl text-[#244B77] text-center"
          style={{ fontFamily: "var(--font-keania-one)" }}
        >
          ClockIn
        </h2>
        <div className="user-name flex items-center pr-5 2xl:pr-0">
          <h4 className="text-[#116B16] font-semibold text-xl mr-10">
            {session?.user?.username || "User"} (Admin)
          </h4>
          <SignOutButton />
        </div>
      </div>
      <TopNavBar />
      <Suspense fallback={<div>Loading sidebar...</div>}>
        <Sidebar />
      </Suspense>
      <main className="ml-64">{children}</main>
    </section>
  );
}
