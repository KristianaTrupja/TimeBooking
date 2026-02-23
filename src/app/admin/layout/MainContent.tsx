"use client";

import { useSidebar } from "@/app/context/SidebarContext";

export default function MainContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  
  return (
    <div className={`flex-1 flex flex-col transition-all duration-300 pt-[60px] lg:pt-0 lg:${isCollapsed ? "ml-[72px]" : "ml-52 2xl:ml-64"}`}>
      <main id="main-content" className="flex-1 overflow-hidden" role="main">{children}</main>
    </div>
  );
}

