"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AddUserModal } from "./AddUserModal";
import { UserTable } from "./UserTable";
import { toast, Toaster } from "sonner";
import { User, UserFormData } from "@/types/user";
import Spinner from "@/components/ui/Spinner";

export default function Users() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    id: 0,
    username: "",
    email: "",
    password: "",
    role: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ users: User[] } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch("/api/user", { cache: "no-store" });
      const data = await res.json();
      setUser(data);
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    };

    fetchUser();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const deleteItem = async (emp: User) => {
    if (!emp.id) return;

    if (window.confirm(`Jeni i sigurt që doni të fshini ${emp.username}?`)) {
      try {
        const res = await fetch("/api/user", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: emp.id }),
          cache: "no-store"
        });

        if (res.ok) {
          setUser((prev) => ({
            users: prev?.users.filter((u) => u.id !== emp.id) || [],
          }));
          toast.success("Përdoruesi u fshi me sukses.");
        } else {
          const err = await res.json();
          toast.error(err.message || "Fshirja dështoi.");
        }
      } catch {
        toast.error("Dështoi lidhja me serverin.");
      }
    }
  };

  const startEditing = (emp: User) => {
    if (!emp.id) return;

    setEditingId(emp.id);
    setFormData({
      id: emp.id,
      username: emp.username,
      email: emp.email,
      password: "",
      role: emp.role,
    });
  };

  const saveChanges = async () => {
    const { id, username, email, role } = formData;
    if (!id || !username || !email || !role) {
      toast.error("Ju lutem plotësoni të gjitha fushat përveç fjalëkalimit.");
      return;
    }

    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, username, email, role }),
        cache: "no-store"
      });

      if (res.ok) {
        const updated = await res.json();
        setUser((prev) => ({
          users: prev?.users.map((u) =>
            u.id === updated.user.id ? updated.user : u
          ) || [],
        }));
        toast.success("Përdoruesi u përditësua me sukses.");
        setEditingId(null);
        setFormData({ id: 0, username: "", email: "", password: "", role: "" });
      } else {
        const err = await res.json();
        toast.error(err.message || "Përditësimi dështoi.");
      }
    } catch {
      toast.error("Gabim gjatë përditësimit.");
    }
  };

  const addNewEmployee = async () => {
    const { username, email, password, role } = formData;
    if (!username || !email || !password || !role) {
      alert("Ju lutem plotësoni të gjitha fushat.");
      return;
    }

    const response = await fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
      cache: "no-store"
    });

    if (response.ok) {
      toast.success("Përdoruesi u shtua me sukses.");
      setOpen(false);
      window.location.reload();
    } else {
      const err = await response.json();
      toast.error(err.message || "Registrimi dështoi. Ju lutem provoni përsëri.");
    }
  };

  if(isLoading) return <Spinner/>

  return (
    <section className="overflow-auto max-h-[500px] 2xl:max-h-[700px] rounded-md pb-10">
      <UserTable
        employees={user?.users || []}
        editingId={editingId}
        formData={formData}
        onChange={handleInputChange}
        onEdit={startEditing}
        onDelete={deleteItem}
        onSave={saveChanges}
      />

      <div className="flex justify-center mt-5 2xl:mt-20">
        <Button onClick={() => setOpen(true)}>Shto të ri</Button>
      </div>

      <AddUserModal
        open={open}
        onClose={() => {
          setOpen(false);
          setFormData({ id: 0, username: "", email: "", password: "", role: "" });
        }}
        formData={formData}
        onChange={handleInputChange}
        onSubmit={addNewEmployee}
      />

      <Toaster />
    </section>
  );
}
