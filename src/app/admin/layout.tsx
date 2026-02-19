import { Suspense } from "react";
import Sidebar from "./layout/Sidebar";
import HeaderNav from "./layout/HeaderNav";
import MainContent from "./layout/MainContent";
import { SidebarProvider } from "@/app/context/SidebarContext";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { Clock } from "lucide-react";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
 
  const session = await getServerSession(authOptions);
  
  return (
    <div
      className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100"
      style={{ fontFamily: "var(--font-anek-bangla)" }}
    >
      {/* Skip Navigation Link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg"
      >
        Skip to main content
      </a>
      
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200 px-6 py-4 shadow-sm" role="banner">
        <div className="flex justify-between items-center">
          <Link href="/admin?tab=raport" className="group flex items-center gap-3 hover:opacity-90 transition-all duration-300">
            {/* Logo Icon */}
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#244B77] to-[#1a3a5c] flex items-center justify-center shadow-lg shadow-[#244B77]/25 group-hover:shadow-[#244B77]/40 transition-shadow duration-300">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full border-2 border-white" />
            </div>
            {/* Logo Text */}
            <div className="flex flex-col leading-none">
              <span 
                className="text-xl font-bold tracking-tight text-slate-800"
                style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
              >
                Work<span className="bg-gradient-to-r from-[#244B77] to-cyan-600 bg-clip-text text-transparent">Time</span>
              </span>
              <span 
                className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500"
                style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
              >
                Hub
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Suspense fallback={null}>
              <HeaderNav />
            </Suspense>
            <div className="h-6 w-px bg-slate-200" />
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
        </div>
      </header>

      {/* Main content area */}
      <SidebarProvider>
        <div className="flex w-full flex-1 pt-[72px]">
          <Suspense fallback={<div className="w-[72px] xl:w-64 bg-slate-800 animate-pulse transition-all duration-300" />}>
            <Sidebar />
          </Suspense>
          <MainContent>{children}</MainContent>
        </div>
      </SidebarProvider>
    </div>
  );
}

