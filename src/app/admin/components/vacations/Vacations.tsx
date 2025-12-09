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
  const [isLoading, setIsLoading] = useState(true);
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
      const navHeight = navRef.current.offsetHeight;
      const buttonHeight = buttonRef.current.offsetHeight;
      const bottomPadding = 24; // Extra padding for safety
      const availableHeight = window.innerHeight - sectionTop - navHeight - buttonHeight - bottomPadding;
      setContainerHeight(Math.max(availableHeight, 200)); // Minimum height of 200px
    }
  }, []);

  useEffect(() => {
    calculateHeight();
    window.addEventListener("resize", calculateHeight);
    return () => window.removeEventListener("resize", calculateHeight);
  }, [calculateHeight, isLoading]);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/vacations?year=${year}`)
      .then((res) => res.json())
      .then((data) => setVacations(data))
      .catch((err) => console.error("Failed to fetch holidays", err))
      .finally(() => {
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      });
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

  if (isLoading) return <Spinner />;
  return (
    <section ref={sectionRef} className="rounded-md">
      {/* Year Navigation Bar */}
      <div ref={navRef} className="flex items-center justify-center gap-4 mb-4">
        <Button variant="ghost" className="border border-accent" onClick={goToPreviousYear}>
          <ChevronLeft />
        </Button>
        <h2 className="text-xl font-bold text-[#244B77]">{year}</h2>
        <Button variant="ghost" className="border border-accent" onClick={goToNextYear}>
          <ChevronRight />
        </Button>
      </div>

      <div
        className="overflow-y-auto"
        style={{ maxHeight: containerHeight ? `${containerHeight}px` : "66vh" }}
      >
        <VacationTable
          vacations={vacations}
          editingId={editingId}
          editedData={editedData}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onChange={handleChange}
          onSave={handleSave}
        />
      </div>

      <div ref={buttonRef} className="flex justify-center my-5">
        <Button onClick={() => setModalOpen(true)}>
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
