
"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserCog } from "lucide-react";

export default function AdminBackButton() {
  const searchParams = useSearchParams();
  const adminId = searchParams.get("adminId");

  if (!adminId) return null;

  return (
    <Link href={`/admin/?adminId=${adminId}`}>
      <Button size="sm" className="mr-2">
        <UserCog />
      </Button>
    </Link>
  );
}

