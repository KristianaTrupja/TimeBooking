import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import Selector from "@/app/components/Selector";
import { User } from "@/types/user";
import Spinner from "@/components/ui/Spinner";
import { Absence, AbsenceType } from "@/types/absence";

export default function Absences() {
  const [openSelectorId, setOpenSelectorId] = useState<string | null>(null);

  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date|null>(null);
  const [endDate, setEndDate] = useState<Date|null>(null);
  const [absenceType, setAbsenceType] = useState<string | null>(null);
  const [employee, setEmployee] = useState<{ users: User[] } | null>(null);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const absenceTypes: (keyof typeof AbsenceType)[] = useMemo(() => ["VACATION", "SICK", "PERSONAL", "PARENTAL"], []);
  const selectorStyle = "bg-[#E3F0FF] text-[#244B77] border-[1px] border-[#244B77]";
  const [isLoading, setIsLoading] = useState(true);

  const handleToggle = useCallback((id: string) => {
    setOpenSelectorId((prev) => (prev === id ? null : id));
  }, []);

  useEffect(() => {
    fetch("/api/absences")
      .then((res) => res.json())
      .then((data) => setAbsences(data.absences || []))
      .catch((err) => console.error("Failed to fetch absences:", err))
      .finally(() => { setTimeout(() => { setIsLoading(false);}, 500);});
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user", { cache: "no-store" });
        const data = await res.json();
        setEmployee(data);
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    };

    fetchUser();
  }, []);

  const handleCreateAbsence = async () => {
    if (!selectedEmployee || !startDate || !endDate || !absenceType) {
      alert("Please fill in all fields");
      return;
    }

    const user = employee?.users.find((u) => u.username === selectedEmployee);
    if (!user) {
      alert("Selected employee not found");
      return;
    }

    try {
      const response = await fetch("/api/absences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          type: absenceType,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to create absence");

      setAbsences((prev) => [...prev, data.absence]);

      // Reset form
      setSelectedEmployee(null);
      setStartDate(null);
      setEndDate(null)
      setAbsenceType(null);

      alert(data.message || "Absence created successfully!");
    } catch (error:any) {
      console.error( "Error creating absence:", error);
      alert(error?.message || "Error creating absence");
    }
  };

  if(isLoading) return <Spinner/>

  return (
    <div className="max-w-2/3 2xl:max-w-1/2">
      <h2 className="text-2xl text-[#244B77] font-bold mb-3 mt-5">
        Krijo lejet për punonjësit
      </h2>

      {/* Employee Selector */}
      <div className="w-1/2 mb-5">
        <Selector
          id="selector-employee"
          label="Selekto emrin e punonjësit"
          variant="absences"
          isOpen={openSelectorId === "selector-employee"}
          onToggle={() => handleToggle("selector-employee")}
          options={employee?.users.map((user) => user.username) || []}
          onChange={setSelectedEmployee}
          defaultValue="Punonjësit"
          className={selectorStyle}
          value={selectedEmployee || ""}
          handleDelete={() => {}}
        />
      </div>

      {/* Date Pickers */}
      <div className="flex flex-col gap-4 bg-[#244B77] p-6 rounded-md text-white">
        <div className="flex items-baseline w-full gap-5 justify-between">
          <label htmlFor="start-date" className="text-md font-bold">
            Data e fillimit:
          </label>
          <input
            type="date"
            id="start-date"
            className="bg-white text-[#244B77] px-3 py-2 text-sm w-2/3"
            value={startDate?.toString()}
            onChange={(e) => setStartDate(new Date(e.target.value))}
          />
        </div>
        <div className="flex items-baseline w-full gap-5 justify-between">
          <label htmlFor="end-date" className="text-md font-bold">
            Data e përfundimit:
          </label>
          <input
            type="date"
            id="end-date"
            className="bg-white text-[#244B77] px-3 py-2 text-sm w-2/3"
            value={endDate?.toString()}
            onChange={(e) => setEndDate(new Date(e.target.value))}
          />
        </div>
      </div>

      {/* Absence Type Selector */}
      <div className="w-1/2 mt-5">
        <Selector
          id="selector-absence"
          label="Selekto tipin e lejes"
          variant="absences"
          isOpen={openSelectorId === "selector-absence"}
          onToggle={() => handleToggle("selector-absence")}
          options={absenceTypes}
          onChange={setAbsenceType}
          defaultValue="Tipi i lejes"
          className={selectorStyle}
          value={absenceType || ""}
          handleDelete={() => {}}
        />
      </div>

      <Button className="mt-10" onClick={handleCreateAbsence}>
        Krijo leje
      </Button>
    </div>
  );
}
