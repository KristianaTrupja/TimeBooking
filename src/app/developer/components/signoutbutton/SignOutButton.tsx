"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function SignOutButton() {
  const onSignout = () => {
    signOut({ callbackUrl: `${window.location.origin}/login` });
  };

  return (
    <Button size="sm" onClick={onSignout} className="">
      <LogOut />
    </Button>
  );
}
