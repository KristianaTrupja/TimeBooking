"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Settings, Users, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { InputField } from "@/app/components/ui/InputField";

export default function SettingsPage() {
  const { data: session } = useSession(); // ✅ Merr të dhënat e userit
  const router = useRouter();

  const [formData, setFormData] = useState({
    username: session?.user?.username ?? "",
    email: session?.user?.email ?? "",
    password: "",
  });

  const handleNavigate = (tab: string) => {
    router.push(`?tab=${tab}`);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const payload: any = {
      id: session?.user?.id,
      username: formData.username,
      email: formData.email,
    };
    if (formData.password.trim()) {
      payload.password = formData.password;
    }

    const res = await fetch("/api/user", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      alert("Përdoruesi u përditësua me sukses!");
    } else {
      alert("Përditësimi dështoi.");
    }
  };
  console.log(formData, "test");

  return (
    <div className="bg-white p-6 rounded-md shadow border border-gray-200 max-w-3xl">
      <h2 className="text-2xl font-bold text-[#244B77] flex items-center gap-2 mb-6">
        <Settings className="w-6 h-6" />
        Cilësimet e llogarisë
      </h2>

      <div className="space-y-4 mb-10">
        <InputField
          label="Emri"
          name="username"
          placeholder="Vendosni emrin"
          value={formData.username}
          onChange={handleChange}
        />
        <InputField
          label="Email"
          name="email"
          placeholder="Vendosni emailin"
          value={formData.email}
          type="email"
          onChange={handleChange}
        />
        <InputField
          label="Fjalëkalimi"
          name="password"
          placeholder="Ndrysho fjalëkalimin"
          value={formData.password}
          type="password"
          onChange={handleChange}
          error=""
        />
        <Button onClick={handleSave} className="w-full">
          Ruaj Ndryshimet
        </Button>
      </div>

      <h3 className="text-xl font-semibold text-[#244B77] mb-4">Modifikime të tjera</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onClick={() => handleNavigate("users")}
          className="cursor-pointer p-4 border border-gray-300 rounded-lg hover:bg-blue-50 transition"
        >
          <div className="flex items-center gap-2 text-lg font-semibold text-[#244B77] mb-2">
            <Users className="w-5 h-5" />
            Userat
          </div>
          <p className="text-sm text-gray-600">Menaxho përdoruesit, shto ose fshij llogari.</p>
        </div>

        <div
          onClick={() => handleNavigate("modify-absences")}
          className="cursor-pointer p-4 border border-gray-300 rounded-lg hover:bg-blue-50 transition"
        >
          <div className="flex items-center gap-2 text-lg font-semibold text-[#244B77] mb-2">
            <Pencil className="w-5 h-5" />
            Modifiko Lejet
          </div>
          <p className="text-sm text-gray-600">Shiko dhe ndrysho lejet e stafit.</p>
        </div>
      </div>
    </div>
  );
}
