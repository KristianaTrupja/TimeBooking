"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarHeart, Calendar, CalendarCheck, CalendarClock, Plus } from "lucide-react";
import VacationTable from "./VacationTable";
import AddVacationModal from "./AddVacationModal";
import { Holiday } from "@/types/holiday";
import Spinner from "@/components/ui/Spinner";
import { toast } from "sonner";

export default function Vacations() {
  const [vacations, setVacations] = useState<Holiday[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedData, setEditedData] = useState({ date: "", holiday: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ date: "", holiday: "" });
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [containerHeight, setContainerHeight] = useState<number | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());

  const sectionRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const goToPreviousYear = () => setYear((prev) => prev - 1);
  const goToNextYear = () => setYear((prev) => prev + 1);

  const calculateHeight = useCallback(() => {
    if (sectionRef.current && buttonRef.current && navRef.current) {
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
    }
  }, []);

  useEffect(() => {
    calculateHeight();
    window.addEventListener("resize", calculateHeight);
    return () => window.removeEventListener("resize", calculateHeight);
  }, [calculateHeight, isInitialLoading]);

  useEffect(() => {
    if (isInitialLoading) {
      // Initial load
      fetch(`/api/vacations?year=${year}`)
        .then((res) => res.json())
        .then((data) => setVacations(data))
        .catch((err) => console.error("Failed to fetch holidays", err))
        .finally(() => {
          setTimeout(() => setIsInitialLoading(false), 500);
        });
    } else {
      // Subsequent year navigation
      setIsTableLoading(true);
      fetch(`/api/vacations?year=${year}`)
        .then((res) => res.json())
        .then((data) => setVacations(data))
        .catch((err) => console.error("Failed to fetch holidays", err))
        .finally(() => {
          setTimeout(() => setIsTableLoading(false), 300);
        });
    }
  }, [year]);

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
    try {
      const res = await fetch("/api/vacations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...editedData }),
      });
      if (!res.ok) throw new Error("Failed to update");

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
      toast.error("Failed to update holiday");
    }
  };

  const handleDelete = async (id: number) => {
    const emp = vacations.find((v) => v.id === id);
    const confirmed = window.confirm(
      `Are you sure you want to delete holiday, date: ${emp?.date}?`
    );
    if (!confirmed) return;

    try {
      const res = await fetch("/api/vacations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to delete");

      setVacations((prev) => prev.filter((v) => v.id !== id));
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete holiday");
    }
  };

  const handleNewChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof typeof newHoliday
  ) => {
    setNewHoliday((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleAdd = async () => {
    if (!newHoliday.date || !newHoliday.holiday) {
      toast.error("Please fill-in the required fields!");
      return;
    }

    try {
      const res = await fetch("/api/vacations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newHoliday),
      });

      if (!res.ok) throw new Error("Failed to add holiday");

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
      toast.error("Failed to add holiday");
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

  if (isInitialLoading) return <Spinner text="Loading holidays..." />;
  return (
    <section ref={sectionRef} className="p-6 flex flex-col h-full">
      {/* Header Section */}
      <div ref={navRef} className="mb-6">
        {/* Title and Navigation */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-400/25">
              <CalendarHeart className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Official Holidays</h1>
              <p className="text-sm text-slate-600">Manage public holidays and days off</p>
            </div>
          </div>
          
          {/* Year Navigation */}
          <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
            <Button 
              variant="ghost" 
              size="sm"
              className="hover:bg-white rounded-lg h-9 w-9 p-0" 
              onClick={goToPreviousYear} 
              disabled={isTableLoading}
              aria-label="Previous year"
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
              aria-label="Next year"
            >
              <ChevronRight className="text-slate-600" size={18} />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
                <Calendar size={16} className="text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                <p className="text-xs text-slate-500">Total Holidays</p>
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
                <p className="text-xs text-emerald-600">Upcoming</p>
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
                <p className="text-xs text-amber-600">Past</p>
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
                <p className="text-xs text-rose-600">Next Holiday</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <section
        className="overflow-y-auto rounded-xl flex-1 bg-white border border-slate-200 shadow-sm custom-scrollbar"
        style={{ maxHeight: containerHeight ? `${containerHeight}px` : "66vh" }}
      >
        {isTableLoading ? (
          <div className="h-64">
            <Spinner size="sm" text="Loading holidays..." />
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
          />
        )}
      </section>

      <div ref={buttonRef} className="flex justify-end pt-4">
        <Button 
          onClick={() => setModalOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 gap-2"
        >
          <Plus size={18} />
          Add Holiday
        </Button>
      </div>

      <AddVacationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onChange={handleNewChange}
        onSubmit={handleAdd}
        data={newHoliday}
      />
    </section>
  );
}
