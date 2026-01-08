"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import VocationTable from "./VocationTable";
import AddVocationModal from "./AddVocationModal";
import { Holiday } from "@/types/holiday";
import Spinner from "@/components/ui/Spinner";

export default function Vocations() {
  const [vocations, setVocations] = useState<Holiday[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedData, setEditedData] = useState({ date: "", holiday: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ date: "", holiday: "" });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vocations")
      .then((res) => res.json())
      .then((data) => setVocations(data))
      .catch((err) => console.error("Failed to fetch holidays", err))
      .finally(() => {
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      });
  }, []);

  const handleEdit = (id: number) => {
    const emp = vocations.find((v) => v.id === id);
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
      const res = await fetch("/api/vocations", {
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

      setVocations((prev) => prev.map((v) => (v.id === id ? updatedItem : v)));
      setEditingId(null);
    } catch (error) {
      console.error(error);
      alert("Failed to update holiday");
    }
  };

  const handleDelete = async (id: number) => {
    const emp = vocations.find((v) => v.id === id);
    const confirmed = window.confirm(
      `A jeni i sigurt që doni të fshini pushimin më datë ${emp?.date}?`
    );
    if (!confirmed) return;

    try {
      const res = await fetch("/api/vocations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to delete");

      setVocations((prev) => prev.filter((v) => v.id !== id));
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
      const res = await fetch("/api/vocations", {
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
      setVocations((prev) => [...prev, newItem]);
      setNewHoliday({ date: "", holiday: "" });
      setModalOpen(false);
    } catch (error) {
      console.error(error);
      alert("Failed to add holiday");
    }
  };

  if (isLoading) return <Spinner />;
  return (
    <section className="rounded-md mb-5">
      <div className="overflow-y-auto max-h-[400px] 2xl:max-h-[520px] pb-10">
        <VocationTable
          vocations={vocations}
          editingId={editingId}
          editedData={editedData}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onChange={handleChange}
          onSave={handleSave}
        />
      </div>

      <div className="flex justify-center my-5 2xl:mt-20">
        <Button onClick={() => setModalOpen(true)}>
          Shto ditë të re pushimi
        </Button>
      </div>

      <AddVocationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onChange={handleNewChange}
        onSubmit={handleAdd}
        data={newHoliday}
      />
    </section>
  );
}
