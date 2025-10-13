"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { InputField } from "../components/ui/InputField";
import TestDbConnection from "./TestDbConnection";
import { isPasswordStrong } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [data, setData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isPasswordStrong(data.password)) {
      toast.error("Password nuk është i sigurt. Kontrolloni kërkesat.");
      return;
    }

    setLoading(true);

    const res = await signIn("credentials", {
      redirect: false,
      email: data.email,
      password: data.password,
    });

    if (res?.error) {
      console.log("SignIn Error", res.error);
      toast.error("Oops! Dicka shkoi gabim. Ju lutem provoni përsëri!");
      setLoading(false);
    } else {
      const session = await getSession();
      const role = session?.user?.role;

      if (role?.toLowerCase() === "admin") {
        router.push(`/admin/?adminId=${session?.user?.id}`);
      } else if (role?.toLowerCase() === "dev") {
        router.push(`/developer/${session?.user?.id}`);
      } else {
        toast.error("No valid role assigned to this user.");
        setLoading(false);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <section className="m-5 sm:m-auto sm:max-w-2/3 lg:max-w-1/3 pt-32">
      <h2 className="text-6xl sm:text-7xl text-[#244B77] text-center">
        <span className="font-bold">DelaTech</span>
        <span className="block text-5xl sm:text-5xl">Time Booking</span>
      </h2>

      <div className="bg-[#F6F6F6] mt-5 p-8 lg:p-20 rounded-md shadow-sm border-b-5 border-[#244B77]">
        <h3 className="text-3xl sm:text-4xl text-[#244B77]">Sign In</h3>
        <form className="mt-8 space-y-6" onSubmit={onSubmit}>
          <div className="flex flex-col">
            <InputField
              label="Email"
              name="email"
              type="email"
              value={data.email}
              onChange={handleChange}
              placeholder="your@email.com"
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col mb-8 lg:mb-12">
            <InputField
              label="Password"
              name="password"
              type="password"
              value={data.password}
              onChange={handleChange}
              placeholder="********"
              autoComplete="current-password"
              error={
                !isPasswordStrong(data.password) && data.password
                  ? "Password must contain at least 8 characters, one uppercase letter A-Z, one number, and one special symbol (! @ # $ % ^ & * ( ) . _ - + =)."
                  : undefined
              }
            />
          </div>
          <div className="flex justify-center">
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? (
                <div className="m-2">
                  <Loader2 className="size-8 animate-spin" />
                </div>
              ) : (
                "Sign In"
              )}
            </Button>
          </div>
        </form>
      </div>
      <Toaster />
    </section>
  );
}
