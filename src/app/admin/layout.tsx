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
      className="pt-3 h-screen flex flex-col"
      style={{ fontFamily: "var(--font-anek-bangla)" }}
    >
      <div className="flex justify-between mb-3 items-center">
        <h2
          className="text-4xl sm:text-6xl text-[#244B77] text-center pl-2"
          style={{ fontFamily: "var(--font-keania-one)" }}
        >
          ClockIn
        </h2>
        <div className="user-name flex items-center pr-5">
          <h4 className="text-[#244B77] font-semibold text-xl mr-10">
            {session?.user?.username || "User"} (Admin)
          </h4>
          <SignOutButton />
        </div>
      </div>
      <TopNavBar />
      <div className="flex w-full grow">
        <Suspense fallback={<div>Loading sidebar...</div>}>
          <Sidebar />
        </Suspense>
        <main className="grow overflow-hidden">{children}</main>
      </div>
    </section>
  );
}
