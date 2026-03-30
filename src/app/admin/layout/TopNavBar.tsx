"use client"
import { Button } from "@/components/ui/button";
import { Bell, Settings,LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TopNavBar() {
  const router = useRouter();
  const onSignout = () => {
    signOut({ callbackUrl: `${window.location.origin}/login` });
  };
  return (
    <header className="w-full bg-[#759D7F] shadow-sm px-2 py-1 flex justify-end">
      <nav className="flex items-center gap-3">
        <Link href="/notifications" className="bg-white p-2 rounded-full text-[#CA0505] transition">
          <Bell className="w-6 h-6" />
        </Link>
        <Link href="/settings" className="border-2 border-[#393B3E] bg-[#B1B1B1] p-2 rounded-full text-[#393B3E] hover:bg-[#393B3E] hover:text-white transition">
          <Settings className="w-6 h-6" />
        </Link>
           <Button variant="secondary" size="sm" onClick={onSignout}><LogOut/></Button>
      </nav>
    </header>
  );
}

