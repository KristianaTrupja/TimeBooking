"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarHeart, Calendar, CalendarCheck, CalendarClock, Plus, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import VacationTable from "./VacationTable";
import AddVacationModal from "./AddVacationModal";
import { Holiday } from "@/types/holiday";
import Spinner from "@/components/ui/Spinner";
import { toast } from "sonner";
import { useLanguage } from "@/app/context/LanguageContext";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import { Modal } from "@/app/components/ui/Modal";
import { LocationOption } from "@/types/user";

export default function Vacations() {
  const { t } = useLanguage();
  const [vacations, setVacations] = useState<Holiday[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedData, setEditedData] = useState({ date: "", holiday: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ date: "", holiday: "" });
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [holidayToDelete, setHolidayToDelete] = useState<Holiday | null>(null);
  const [containerHeight, setContainerHeight] = useState<number | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [isCreatingLocation, setIsCreatingLocation] = useState(false);
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
  const navRef = useRef<HTMLDivElement>(null);

  const goToPreviousYear = () => setYear((prev) => prev - 1);
  const goToNextYear = () => setYear((prev) => prev + 1);

  const calculateHeight = useCallback(() => {
    if (sectionRef.current && buttonRef.current && navRef.current) {
      if (window.innerWidth >= 1024) {
        const sectionTop = sectionRef.current.getBoundingClientRect().top;
        
        const navStyles = window.getComputedStyle(navRef.current);
        const navHeight = navRef.current.offsetHeight + 
          parseFloat(navStyles.marginTop) + parseFloat(navStyles.marginBottom);
        
        const buttonStyles = window.getComputedStyle(buttonRef.current);
        const buttonHeight = buttonRef.current.offsetHeight + 
          parseFloat(buttonStyles.marginTop) + parseFloat(buttonStyles.marginBottom);
        
        const bottomPadding = 16;
        const availableHeight = window.innerHeight - sectionTop - navHeight - buttonHeight - bottomPadding;
        setContainerHeight(Math.max(availableHeight, 200));
      } else {
        setContainerHeight(null);
      }
    }
  }, []);

  useEffect(() => {
    calculateHeight();
    window.addEventListener("resize", calculateHeight);
    return () => window.removeEventListener("resize", calculateHeight);
  }, [calculateHeight, isInitialLoading, isTableExpanded]);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await fetch("/api/locations", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(t.failedToLoadLocations);
      }
      const data = await res.json();
      const locationList: LocationOption[] = data.locations || [];
      setLocations(locationList);
      setSelectedLocationId((prev) => {
        if (prev && locationList.some((location) => location.id === prev)) {
          return prev;
        }
        return locationList[0]?.id ?? null;
      });
    } catch (error) {
      console.error(error);
      toast.error(t.failedToLoadLocations);
      setLocations([]);
      setSelectedLocationId(null);
    }
  }, [t.failedToLoadLocations]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  useEffect(() => {
    if (!selectedLocationId) {
      setVacations([]);
      setIsTableLoading(false);
      setIsInitialLoading(false);
      return;
    }

    const url = `/api/vacations?year=${year}&locationId=${selectedLocationId}`;

    if (isInitialLoading) {
      // Initial load
      fetch(url)
        .then((res) => res.json())
        .then((data) => setVacations(data))
        .catch((err) => console.error("Failed to fetch holidays", err))
        .finally(() => {
          setTimeout(() => setIsInitialLoading(false), 500);
        });
    } else {
      // Subsequent year navigation
      setIsTableLoading(true);
      fetch(url)
        .then((res) => res.json())
        .then((data) => setVacations(data))
        .catch((err) => console.error("Failed to fetch holidays", err))
        .finally(() => {
          setTimeout(() => setIsTableLoading(false), 300);
        });
    }
  }, [year, selectedLocationId]);

  const handleEdit = (id: number) => {
    const emp = vacations.find((v) => v.id === id);
    if (emp) {
      setEditingId(id);
      setEditedData({ date: emp.date, holiday: emp.title });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof typeof editedData
  ) => {
    setEditedData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async (id: number) => {
    if (!selectedLocationId) {
      toast.error(t.selectLocationFirst);
      return;
    }

    setSavingId(id);
    try {
      const res = await fetch("/api/vacations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, locationId: selectedLocationId, ...editedData }),
      });
      if (!res.ok) throw new Error(t.failedToUpdateHoliday);

      const updated = await res.json();
      const updatedItem = {
        id: updated.holiday.id,
        date: updated.holiday.date,
        title: updated.holiday.holiday,
      };

      setVacations((prev) => prev.map((v) => (v.id === id ? updatedItem : v)));
      setEditingId(null);
    } catch (error) {
      console.error(error);
      toast.error(t.failedToUpdateHoliday);
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = (id: number) => {
    const emp = vacations.find((v) => v.id === id);
    if (!emp) return;
    setHolidayToDelete(emp);
  };

  const confirmDelete = async () => {
    if (!holidayToDelete) return;
    const id = holidayToDelete.id;
    setDeletingId(id);
    try {
      const res = await fetch("/api/vacations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error(t.failedToDeleteHoliday);

      setVacations((prev) => prev.filter((v) => v.id !== id));
    } catch (error) {
      console.error(error);
      toast.error(t.failedToDeleteHoliday);
    } finally {
      setDeletingId(null);
      setHolidayToDelete(null);
    }
  };

  const handleNewChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof typeof newHoliday
  ) => {
    setNewHoliday((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleAdd = async () => {
    if (!selectedLocationId) {
      toast.error(t.selectLocationFirst);
      return;
    }

    if (!newHoliday.date || !newHoliday.holiday) {
      toast.error(t.pleaseFillRequiredFields);
      return;
    }

    setIsAdding(true);
    try {
      const res = await fetch("/api/vacations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newHoliday, locationId: selectedLocationId }),
      });

      if (!res.ok) throw new Error(t.failedToAddHoliday);

      const data = await res.json();
      const newItem = {
        id: data.holiday.id,
        date: data.holiday.date,
        title: data.holiday.holiday,
      };
      setVacations((prev) => [...prev, newItem]);
      setNewHoliday({ date: "", holiday: "" });
      setModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(t.failedToAddHoliday);
    } finally {
      setIsAdding(false);
    }
  };

  const selectedLocationName = useMemo(
    () => locations.find((location) => location.id === selectedLocationId)?.name ?? null,
    [locations, selectedLocationId]
  );

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
      setSelectedLocationId(createdLocation.id);
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcoming = vacations.filter(v => new Date(v.date) >= today).length;
    const past = vacations.filter(v => new Date(v.date) < today).length;
    
    // Find next holiday
    const sortedUpcoming = vacations
      .filter(v => new Date(v.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const nextHoliday = sortedUpcoming[0];
    
    return { total: vacations.length, upcoming, past, nextHoliday };
  }, [vacations]);

  if (isInitialLoading) return <Spinner text={t.loadingHolidays} />;
  return (
    <section ref={sectionRef} className="p-6 flex flex-col h-full">
      {/* Header Section */}
      <div ref={navRef}>
        {/* Title and Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 items-left sm:items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-400/25">
              <CalendarHeart className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{t.officialHolidays}</h1>
              <p className="text-sm text-slate-600">{t.managePublicHolidays}</p>
            </div>
          </div>
          
          {/* Year Navigation */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-2 py-1">
              <MapPin size={14} className="text-slate-500" />
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 hidden sm:inline">{t.location}</span>
              <select
                value={selectedLocationId ?? ""}
                onChange={(e) => setSelectedLocationId(Number(e.target.value) || null)}
                className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none"
              >
                <option value="" disabled>
                  {t.selectLocation}
                </option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                className="h-7 px-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-colors flex items-center justify-center gap-1"
                title={t.addLocation}
                aria-label={t.addLocation}
              >
                <Plus size={14} />
                <span className="text-xs font-medium hidden sm:inline">{t.add}</span>
              </button>
            </div>
            <button
              onClick={() => setIsTableExpanded((prev) => !prev)}
              className={`h-9 w-9 rounded-xl border transition-all duration-200 flex items-center justify-center hover:scale-105 active:scale-95 ${
                isTableExpanded
                  ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-cyan-400 shadow-lg shadow-cyan-500/35 ring-2 ring-cyan-200/60"
                  : "bg-gradient-to-br from-white to-slate-50 text-slate-700 border-slate-300 shadow-sm hover:shadow-md hover:border-cyan-400 hover:text-cyan-700"
              }`}
              aria-label={isTableExpanded ? t.collapseTableView : t.expandTableView}
              title={isTableExpanded ? t.collapseTableView : t.expandTableView}
            >
              {isTableExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
            <Button 
              variant="ghost" 
              size="sm"
              className="hover:bg-white rounded-lg h-9 w-9 p-0" 
              onClick={goToPreviousYear} 
              disabled={isTableLoading}
              aria-label={t.previousYear}
            >
              <ChevronLeft className="text-slate-600" size={18} />
            </Button>
            <span className="text-sm font-semibold text-slate-700 min-w-[80px] text-center">{year}</span>
            <Button 
              variant="ghost" 
              size="sm"
              className="hover:bg-white rounded-lg h-9 w-9 p-0" 
              onClick={goToNextYear} 
              disabled={isTableLoading}
              aria-label={t.nextYear}
            >
              <ChevronRight className="text-slate-600" size={18} />
            </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className={`${isTableExpanded ? "hidden" : "grid"} grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6`}>
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
                <Calendar size={16} className="text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                <p className="text-xs text-slate-500">{t.totalHolidaysLabel}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-200 flex items-center justify-center">
                <CalendarCheck size={16} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700">{stats.upcoming}</p>
                <p className="text-xs text-emerald-600">{t.upcoming}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-200 flex items-center justify-center">
                <CalendarClock size={16} className="text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">{stats.past}</p>
                <p className="text-xs text-amber-600">{t.past}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-4 border border-rose-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-200 flex items-center justify-center">
                <CalendarHeart size={16} className="text-rose-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-rose-700 truncate max-w-[120px]" title={stats.nextHoliday?.title}>
                  {stats.nextHoliday?.title || "—"}
                </p>
                <p className="text-xs text-rose-600">{t.nextHoliday}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-700">
          {t.locationHolidayManagementHint}
        </div>
      </div>

      {/* Table Section */}
      <section
        className="overflow-y-auto rounded-xl flex-1 bg-white sm:border sm:border-slate-200 sm:shadow-sm custom-scrollbar p-1 sm:p-0"
        style={{ maxHeight: !isMobileLayout ? (containerHeight ? `${containerHeight}px` : "66vh") : undefined }}
      >
        {!selectedLocationId ? (
          <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center px-4">
            <p className="text-slate-700 font-semibold mb-1">{t.noLocationSelected}</p>
            <p className="text-sm text-slate-500 mb-4">{t.createOrChooseLocation}</p>
            <Button onClick={() => setIsLocationModalOpen(true)} className="gap-2">
              <Plus size={16} />
              {t.addLocation}
            </Button>
          </div>
        ) : isTableLoading ? (
          <div className="h-64">
            <Spinner size="sm" text={t.loadingHolidays} />
          </div>
        ) : (
          <VacationTable
            vacations={vacations}
            editingId={editingId}
            editedData={editedData}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onChange={handleChange}
            onSave={handleSave}
            savingId={savingId}
            deletingId={deletingId}
          />
        )}
      </section>

      <div ref={buttonRef} className="flex justify-end pt-4">
        <Button 
          onClick={() => setModalOpen(true)}
          disabled={!selectedLocationId}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 gap-2"
        >
          <Plus size={18} />
          {t.addHoliday}
        </Button>
      </div>
      <Modal
        isOpen={holidayToDelete !== null}
        onClose={() => {
          if (deletingId !== null) return;
          setHolidayToDelete(null);
        }}
        title={t.deleteHolidayTitle}
        className="max-w-md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setHolidayToDelete(null)}
              disabled={deletingId !== null}
            >
              {t.cancel}
            </Button>
            <Button
              onClick={confirmDelete}
              loading={deletingId !== null}
              className="bg-rose-600 hover:bg-rose-500 text-white"
            >
              {t.delete}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-700">
          {t.deleteHolidayConfirm.replace("{date}", holidayToDelete?.date || "")}
        </p>
      </Modal>
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

      <AddVacationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onChange={handleNewChange}
        onSubmit={handleAdd}
        data={newHoliday}
        locationName={selectedLocationName}
        isLoading={isAdding}
      />
    </section>
  );
}
