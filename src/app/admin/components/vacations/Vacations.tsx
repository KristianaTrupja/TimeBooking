"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import VacationTable from "./VacationTable";
import AddVacationModal from "./AddVacationModal";
import { Holiday } from "@/types/holiday";
import Spinner from "@/components/ui/Spinner";

export default function Vacations() {
  const [vacations, setVacations] = useState<Holiday[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedData, setEditedData] = useState({ date: "", holiday: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ date: "", holiday: "" });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vacations")
      .then((res) => res.json())
      .then((data) => setVacations(data))
      .catch((err) => console.error("Failed to fetch holidays", err))
      .finally(() => {
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      });
  }, []);

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
      alert("Failed to update holiday");
    }
  };

  const handleDelete = async (id: number) => {
    const emp = vacations.find((v) => v.id === id);
    const confirmed = window.confirm(
      `A jeni i sigurt që doni të fshini pushimin më datë ${emp?.date}?`
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
      alert("Failed to delete holiday");
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
      alert("Ju lutem plotësoni të gjitha fushat e detyrueshme.");
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
      alert("Failed to add holiday");
    }
  };

  if (isLoading) return <Spinner />;
  return (
    <section className="rounded-md">
      <div className="overflow-y-auto max-h-[66vh]">
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

      <div className="flex justify-center my-5">
        <Button onClick={() => setModalOpen(true)}>
          Shto ditë të re pushimi
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
