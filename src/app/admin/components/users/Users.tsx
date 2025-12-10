"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { AddUserModal } from "./AddUserModal";
import { UserTable } from "./UserTable";
import { toast, Toaster } from "sonner";
import { User, UserFormData } from "@/types/user";
import Spinner from "@/components/ui/Spinner";
import { isPasswordStrong } from "@/lib/utils";

export default function Users() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    id: 0,
    username: "",
    email: "",
    password: "",
    role: "",
    totalVacations: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ users: User[] } | null>(null);
  const [containerHeight, setContainerHeight] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  const calculateHeight = useCallback(() => {
    if (sectionRef.current && buttonRef.current) {
      const sectionTop = sectionRef.current.getBoundingClientRect().top;
      const buttonStyles = window.getComputedStyle(buttonRef.current);
      const buttonHeight = buttonRef.current.offsetHeight + 
        parseFloat(buttonStyles.marginTop) + parseFloat(buttonStyles.marginBottom);
      const bottomPadding = 16;
      const availableHeight = window.innerHeight - sectionTop - buttonHeight - bottomPadding;
      setContainerHeight(Math.max(availableHeight, 200));
    }
  }, []);

  useEffect(() => {
    calculateHeight();
    window.addEventListener("resize", calculateHeight);
    return () => window.removeEventListener("resize", calculateHeight);
  }, [calculateHeight, isLoading]);

  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch("/api/user", { cache: "no-store" });
      const data = await res.json();
      const sortedUsers = data.users.sort((a: User, b: User) =>
        a.username.localeCompare(b.username)
      );
      setUser({ users: sortedUsers });
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    };

    fetchUser();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const deleteItem = async (emp: User) => {
    if (!emp.id) return;

    if (window.confirm(`Are you sure you want to delete ${emp.username}?`)) {
      try {
        const res = await fetch("/api/user", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: emp.id }),
          cache: "no-store",
        });

        if (res.ok) {
          setUser((prev) => ({
            users: prev?.users.filter((u) => u.id !== emp.id) || [],
          }));
          toast.success("Employee data successfully deleted.");
        } else {
          const err = await res.json();
          toast.error(err.message || "Deleting failed!");
        }
      } catch {
        toast.error("Connection to server failed!");
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
      totalVacations: emp.totalVacations
    });
  };

  const saveChanges = async () => {
    const { id, username, email, role, password, totalVacations } = formData;
    if (!id || !username || !email || !role || (!isPasswordStrong(password) && password)) {
      toast.error("Please fill-in the required fields!");
      return;
    }
    const payload: any = { id, username, email, role, totalVacations: Number(totalVacations) };
    if (password.trim()) {
      payload.password = password;
    }
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      if (res.ok) {
        const updated = await res.json();
        setUser((prev) => ({
          users:
            prev?.users.map((u) =>
              u.id === updated.user.id ? updated.user : u
            ) || [],
        }));
        toast.success("Employee was successfully updated.");
        setEditingId(null);
        setFormData({ id: 0, username: "", email: "", password: "", role: "", totalVacations: 0 });
      } else {
        const err = await res.json();
        toast.error(err.message || "Updating failed!");
      }
    } catch {
      toast.error("An error occurred while attempting to update!");
    }
  };

  const addNewEmployee = async () => {
    const { username, email, password, role } = formData;

    if (!username || !email || !password || !role) {
      toast.error("Please fill-in all the fields.");
      return;
    }

    if (!isPasswordStrong(formData.password)) {
      toast.error("Weak password. Meet the requirements.");
      return;
    }
    const response = await fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
      cache: "no-store",
    });

    if (response.ok) {
      toast.success("Employee was added successfully.");
      setOpen(false);
      window.location.reload();
    } else {
      const err = await response.json();
      toast.error(
        err.message || "Registration failed! Please try again."
      );
    }
  };

  if (isLoading) return <Spinner />;

  return (
  <section ref={sectionRef} className="rounded-md grid h-full box-border">
      <section
        className="overflow-y-auto rounded-md"
        style={{ maxHeight: containerHeight ? `${containerHeight}px` : "66vh" }}
      >
        <UserTable
          employees={user?.users || []}
          editingId={editingId}
          formData={formData}
          onChange={handleInputChange}
          onEdit={startEditing}
          onDelete={deleteItem}
          onSave={saveChanges}
        />

        <AddUserModal
          open={open}
          onClose={() => {
            setOpen(false);
            setFormData({
              id: 0,
              username: "",
              email: "",
              password: "",
              role: "",
              totalVacations: 0
            });
          }}
          formData={formData}
          onChange={handleInputChange}
          onSubmit={addNewEmployee}
        />

      </section>
      <div ref={buttonRef} className="min-h-max mx-auto py-4">
        <Button onClick={() => setOpen(true)}>Add new employee</Button>
      </div>
  </section>
  );
}