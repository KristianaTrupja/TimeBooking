"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

  if (isInitialLoading) return <Spinner text="Loading holidays..." />;
  return (
    <section ref={sectionRef} className="p-6 flex flex-col h-full">
      {/* Year Navigation Bar */}
      <div ref={navRef} className="flex items-center justify-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="sm"
          className="hover:bg-slate-100 border border-slate-200 rounded-lg" 
          onClick={goToPreviousYear} 
          disabled={isTableLoading}
        >
          <ChevronLeft className="text-slate-600" size={20} />
        </Button>
        <h2 className="text-xl font-semibold text-slate-700 min-w-[100px] text-center">{year}</h2>
        <Button 
          variant="ghost" 
          size="sm"
          className="hover:bg-slate-100 border border-slate-200 rounded-lg" 
          onClick={goToNextYear} 
          disabled={isTableLoading}
        >
          <ChevronRight className="text-slate-600" size={20} />
        </Button>
      </div>

      <div
        className="overflow-y-auto rounded-xl flex-1"
        style={{ maxHeight: containerHeight ? `${containerHeight}px` : "66vh" }}
      >
        {isTableLoading ? (
          <Spinner size="sm" text="" />
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
      </div>

      <div ref={buttonRef} className="flex justify-center py-4">
        <Button 
          onClick={() => setModalOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md"
        >
          Add new holiday
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
