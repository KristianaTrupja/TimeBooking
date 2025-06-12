"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { title: "Raport", tab: "raport" },
  { title: "Projektet", tab: "projects" },
  { title: "Userat", tab: "users" },
  { title: "Sheno Lejet", tab: "absences" },
  { title: "Modifiko Lejet", tab: "modify-absences" },
  { title: "Pushimet", tab: "holidays" }
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
    <aside
      className="mt-32 absolute top-0 w-64 h-[80vh] bg-[#244B77] py-18 px-4 shadow-md"
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
