"use client";
import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { AddUserModal } from "./AddUserModal";
import { UserTable } from "./UserTable";
import { toast } from "sonner";
import { LocationOption, User, UserFormData } from "@/types/user";
import Spinner from "@/components/ui/Spinner";
import { isPasswordStrong } from "@/lib/utils";
import { Users as UsersIcon, UserPlus, Shield, Code, ChevronDown, ChevronUp, MapPin, Plus } from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import { Modal } from "@/app/components/ui/Modal";

export default function Users() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    id: 0,
    username: "",
    email: "",
    password: "",
    role: "",
    locationId: 0,
    totalVacations: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [user, setUser] = useState<{ users: User[] } | null>(null);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>("all");
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [isCreatingLocation, setIsCreatingLocation] = useState(false);
  const [containerHeight, setContainerHeight] = useState<number | null>(null);
  const isMobile = useIsMobile();
  const isMobileLayout = useIsMobile(1024);
  const [isTableExpanded, setIsTableExpanded] = useState(false);
  
  // When mobile, always keep expander collapsed
  useEffect(() => {
    if (isMobile) {
      setIsTableExpanded(true);
    } else {
      setIsTableExpanded(false);
    }
  }, [isMobile]);
  const sectionRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  const calculateHeight = useCallback(() => {
    if (sectionRef.current && buttonRef.current) {
      if (window.innerWidth >= 1024) {
        const sectionTop = sectionRef.current.getBoundingClientRect().top;
        const buttonStyles = window.getComputedStyle(buttonRef.current);
        const buttonHeight = buttonRef.current.offsetHeight + 
          parseFloat(buttonStyles.marginTop) + parseFloat(buttonStyles.marginBottom);
        const bottomPadding = 16;
        const availableHeight = window.innerHeight - sectionTop - buttonHeight - bottomPadding;
        setContainerHeight(Math.max(availableHeight, 200));
      } else {
        setContainerHeight(null);
      }
    }
  }, [t.failedToLoadUsers]);

  useEffect(() => {
    calculateHeight();
    window.addEventListener("resize", calculateHeight);
    return () => window.removeEventListener("resize", calculateHeight);
  }, [calculateHeight, isLoading, isTableExpanded]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const [usersRes, locationsRes] = await Promise.all([
          fetch("/api/user", { cache: "no-store" }),
          fetch("/api/locations", { cache: "no-store" }),
        ]);

        if (!usersRes.ok) {
          throw new Error(t.failedToLoadUsers);
        }

        const data = await usersRes.json();
        const sortedUsers = (data.users || []).sort((a: User, b: User) =>
          a.username.localeCompare(b.username)
        );
        setUser({ users: sortedUsers });

        if (locationsRes.ok) {
          const locationsData = await locationsRes.json();
          setLocations(locationsData.locations || []);
        } else {
          setLocations([]);
        }
      } catch (error) {
        console.error(error);
        toast.error(t.failedToLoadUsers);
        setUser({ users: [] });
        setLocations([]);
      } finally {
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }
    };

    fetchUser();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "totalVacations" || name === "locationId"
          ? Number(value)
          : value,
    }));
  };

  const deleteItem = (emp: User) => {
    if (!emp.id) return;
    setUserToDelete(emp);
  };

  const confirmDeleteItem = async () => {
    if (!userToDelete?.id) return;
    setDeletingId(userToDelete.id);
    try {
      const res = await fetch("/api/user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userToDelete.id }),
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        setUser((prev) => ({
          users: prev?.users.filter((u) => u.id !== userToDelete.id) || [],
        }));
        toast.success(data.message);
      } else {
        const err = await res.json();
        toast.error(err.message || "Operation failed!");
      }
    } catch {
      toast.error("Connection to server failed!");
    } finally {
      setDeletingId(null);
      setUserToDelete(null);
    }
  };

  const startEditing = (emp: User) => {
    if (!emp.id) return;

    setEditingId(emp.id);
    setFormData({
      id: emp.id,
      username: emp.username,
      email: emp.email ?? "",
      password: "",
      role: emp.role,
      locationId: emp.locationId,
      totalVacations: emp.totalVacations
    });
  };

  const saveChanges = async () => {
    const { id, username, email, role, password, totalVacations, locationId } = formData;
    if (!id || !username || !role || !locationId || (!isPasswordStrong(password) && password.trim())) {
      toast.error(t.pleaseFillRequiredFields);
      return;
    }

    // Email is required only for Admin role
    if (role === "Admin" && !email) {
      toast.error(t.emailRequiredForAdmin);
      return;
    }
    const payload: any = { id, username, email, role, locationId, totalVacations: Number(totalVacations) };
    if (password.trim()) {
      payload.password = password;
    }
    setIsSaving(true);
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
        toast.success(t.employeeUpdatedSuccessfully);
        setEditingId(null);
        setFormData({ id: 0, username: "", email: "", password: "", role: "", locationId: 0, totalVacations: 0 });
      } else {
        const err = await res.json();
        toast.error(err.message || t.updatingFailed);
      }
    } catch {
      toast.error(t.updateAttemptFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const addNewEmployee = async () => {
    const { username, email, password, role, locationId } = formData;

    if (!username || !password || !role || !locationId) {
      toast.error(t.pleaseFillAllFields);
      return;
    }

    // Email is required only for Admin role
    if (role === "Admin" && !email) {
      toast.error(t.emailRequiredForAdmin);
      return;
    }

    if (!isPasswordStrong(formData.password)) {
      toast.error(t.weakPasswordMeetRequirements);
      return;
    }
    setIsAdding(true);
    try {
      const response = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        const createdUser: User | undefined = data?.user
          ? {
              ...data.user,
              locationName: data.user.locationName ?? data.user.location?.name ?? null,
            }
          : undefined;
        toast.success(data?.message || t.employeeAddedSuccessfully);
        setOpen(false);
        if (createdUser?.id) {
          setUser((prev) => {
            const next = [...(prev?.users || []), createdUser].sort((a, b) =>
              a.username.localeCompare(b.username)
            );
            return { users: next };
          });
        }
      } else {
        const err = await response.json();
        toast.error(
          err.message || t.registrationFailedTryAgain
        );
      }
    } finally {
      setIsAdding(false);
    }
  };

  const createLocation = async () => {
    const trimmedName = newLocationName.trim();
    if (!trimmedName) {
      toast.error(t.locationRequired);
      return;
    }

    setIsCreatingLocation(true);
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || t.failedToCreateLocation);
      }

      const createdLocation: LocationOption = data.location;
      setLocations((prev) =>
        [...prev, createdLocation].sort((a, b) => a.name.localeCompare(b.name))
      );
      setNewLocationName("");
      setIsLocationModalOpen(false);
      toast.success(data.message || t.locationCreatedSuccessfully);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || t.failedToCreateLocation);
    } finally {
      setIsCreatingLocation(false);
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const employees = user?.users || [];
    return {
      total: employees.length,
      admins: employees.filter(u => u.role === "Admin").length,
      devs: employees.filter(u => u.role === "Dev").length,
    };
  }, [user]);

  const filteredUsers = useMemo(() => {
    const allUsers = user?.users || [];
    if (selectedLocationFilter === "all") return allUsers;
    const locationId = Number(selectedLocationFilter);
    if (!Number.isFinite(locationId)) return allUsers;
    return allUsers.filter((employee) => employee.locationId === locationId);
  }, [user, selectedLocationFilter]);

  if (isLoading) return (
    <div className="h-full">
      <Spinner text={t.loadingEmployees} />
    </div>
  );

  return (
    <section ref={sectionRef} className="p-3 py-6 sm:p-6 flex flex-col h-full">
      {/* Header Section */}
      <div ref={buttonRef}>
        {/* Title and Add Button */}
        <div className="flex flex-col gap-4 sm:gap-0 sm:flex-row items-left sm:items-center  justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <UsersIcon className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-800">{t.employeeManagement}</h1>
              <p className="text-sm text-slate-500">{t.manageTeam}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-2 py-1">
              <MapPin size={14} className="text-slate-500" />
              <select
                value={selectedLocationFilter}
                onChange={(e) => setSelectedLocationFilter(e.target.value)}
                className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none"
              >
                <option value="all">{t.allLocations}</option>
                {locations.map((location) => (
                  <option key={location.id} value={String(location.id)}>
                    {location.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                className="h-7 w-7 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-colors flex items-center justify-center"
                title={t.addLocation}
                aria-label={t.addLocation}
              >
                <Plus size={14} />
              </button>
            </div>
            <button
              onClick={() => setIsTableExpanded((prev) => !prev)}
              className={`h-10 w-10 rounded-xl border transition-all duration-200 flex items-center justify-center hover:scale-105 active:scale-95 ${
                isTableExpanded
                  ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-cyan-400 shadow-lg shadow-cyan-500/35 ring-2 ring-cyan-200/60"
                  : "bg-gradient-to-br from-white to-slate-50 text-slate-700 border-slate-300 shadow-sm hover:shadow-md hover:border-cyan-400 hover:text-cyan-700"
              }`}
              aria-label={isTableExpanded ? t.collapseTableView : t.expandTableView}
              title={isTableExpanded ? t.collapseTableView : t.expandTableView}
            >
              {isTableExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <Button 
              onClick={() => setOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25"
            >
              <UserPlus size={18} className="mr-2" />
              {t.addEmployee}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className={`${isTableExpanded ? "hidden" : "grid"} grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mb-6`}>
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
                <UsersIcon size={16} className="text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                <p className="text-xs text-slate-500">{t.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-200 flex items-center justify-center">
                <Shield size={16} className="text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-violet-700">{stats.admins}</p>
                <p className="text-xs text-violet-600">{t.admins}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-200 flex items-center justify-center">
                <Code size={16} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700">{stats.devs}</p>
                <p className="text-xs text-emerald-600">{t.developers}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <section
        className="overflow-y-auto rounded-xl flex-1 bg-white sm:border sm:border-slate-200 sm:shadow-sm custom-scrollbar p-1 sm:p-0"
        style={{ maxHeight: !isMobileLayout ? (containerHeight ? `${containerHeight}px` : "66vh") : undefined }}
      >
        <UserTable
          employees={filteredUsers}
          locations={locations}
          editingId={editingId}
          formData={formData}
          onChange={handleInputChange}
          onEdit={startEditing}
          onDelete={deleteItem}
          onSave={saveChanges}
          isSaving={isSaving}
          deletingId={deletingId}
        />
      </section>

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
            locationId: 0,
            totalVacations: 0
          });
        }}
        formData={formData}
        locations={locations}
        onChange={handleInputChange}
        onSubmit={addNewEmployee}
        isLoading={isAdding}
      />
      <Modal
        isOpen={isLocationModalOpen}
        onClose={() => {
          if (isCreatingLocation) return;
          setIsLocationModalOpen(false);
        }}
        title={t.createLocation}
        className="max-w-md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setIsLocationModalOpen(false)}
              disabled={isCreatingLocation}
            >
              {t.cancel}
            </Button>
            <Button onClick={createLocation} loading={isCreatingLocation}>
              {t.createLocation}
            </Button>
          </div>
        }
      >
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {t.locationName}
        </label>
        <input
          value={newLocationName}
          onChange={(e) => setNewLocationName(e.target.value)}
          placeholder={t.locationNameExample}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
        />
      </Modal>
      <Modal
        isOpen={userToDelete !== null}
        onClose={() => {
          if (deletingId !== null) return;
          setUserToDelete(null);
        }}
        title={t.deleteEmployeeTitle}
        className="max-w-md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setUserToDelete(null)}
              disabled={deletingId !== null}
            >
              {t.cancel}
            </Button>
            <Button
              onClick={confirmDeleteItem}
              loading={deletingId !== null}
              className="bg-rose-600 hover:bg-rose-500 text-white"
            >
              {t.delete}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-700 leading-relaxed">
          {t.deleteEmployeeConfirm.replace("{name}", userToDelete?.username || t.employee)}
        </p>
        <p className="text-sm text-slate-500">
          {t.deleteEmployeeWarning}
        </p>
      </Modal>
    </section>
  );
}
