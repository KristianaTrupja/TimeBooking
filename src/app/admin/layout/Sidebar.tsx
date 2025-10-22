"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { title: "Timesheets", tab: "raport" },
  { title: "Projects", tab: "projects" },
  { title: "Employees", tab: "users" },
  { title: "Grant Leave", tab: "absences" },
  { title: "View Leaves", tab: "modify-absences" },
  { title: "Official Holidays", tab: "holidays" }
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentTab = searchParams.get("tab") || "raport";

  const handleClick = (tab: string) => {
    router.push(`${pathname}?tab=${tab}`);
  };

  return (
    <aside className="min-w-64 w-64 bg-[#244B77] py-18 px-4 shadow-md"
      style={{ fontFamily: "var(--font-anek-bangla)" }}
    >
      <nav className="flex flex-col gap-4">
        {sidebarItems.map((item, index) => {
          const isActive = currentTab === item.tab;

          return (
            <button
              key={index}
              onClick={() => handleClick(item.tab)}
              className={cn(
                "text-[#244B77] font-semibold text-center cursor-pointer bg-white py-2 px-4 rounded hover:bg-[#6C99CB] hover:text-white transition",
                isActive && "bg-[#6C99CB] text-white"
              )}
            >
              {item.title}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
