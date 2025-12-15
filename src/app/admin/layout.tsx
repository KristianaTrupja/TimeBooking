import { Suspense } from "react";
import Sidebar from "./layout/Sidebar";
import TopNavBar from "./layout/TopNavBar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
 
  const session = await getServerSession(authOptions);
  
  return (
    <div
      className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100"
      style={{ fontFamily: "var(--font-anek-bangla)" }}
    >
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="flex justify-between items-center">
          <h2
            className="text-3xl sm:text-4xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent"
            style={{ fontFamily: "var(--font-inter), sans-serif", fontWeight: "600", letterSpacing: "-1px" }}
          >
            <Link href="/admin?tab=raport" className="hover:opacity-80 transition-opacity">
              WorkTime Hub
            </Link>
          </h2>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h4 className="text-slate-700 font-medium text-base tracking-wide">
              {session?.user?.username || "User"}
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-violet-100 text-violet-700">
                Admin
              </span>
            </h4>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex w-full flex-1 pt-[72px]">
        <Suspense fallback={<div className="w-64 bg-slate-800 animate-pulse" />}>
          <Sidebar />
        </Suspense>
        <div className="flex-1 flex flex-col ml-64">
          <TopNavBar />
          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </div>
    </div>
  );
}
