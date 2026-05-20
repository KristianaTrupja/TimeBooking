"use client";

import { useSidebar } from "@/app/context/SidebarContext";

export default function MainContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  console.log("MainContent isCollapsed", isCollapsed);

  return (
    <div className={`flex-1 flex flex-col transition-all duration-300 pt-[60px] lg:pt-0 ${isCollapsed ? "lg:ml-[72px]" : "lg:ml-52 2xl:ml-64"}`}>
      <main id="main-content" className="flex-1 overflow-visible lg:overflow-hidden" role="main">
        {children}
      </main>
    </div>
  );
}

