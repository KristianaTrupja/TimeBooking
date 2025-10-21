import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Selector from "@/app/components/Selector";
import { User } from "@/types/user";
import Spinner from "@/components/ui/Spinner";
import { AbsenceType } from "@/types/absence";
import { flushError } from "@/app/utils/flushError";
import { toast } from "sonner";

const absenceTypes: (keyof typeof AbsenceType)[] = ["VACATION", "SICK", "PERSONAL", "PARENTAL"]
const selectorStyle = "bg-[#E3F0FF] text-[#244B77] border-[1px] border-[#244B77]"

export default function Absences() {
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [absenceType, setAbsenceType] = useState<string | null>(null)
  const [employees, setEmployees] = useState<User[]| null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [daysLeft, setDaysLeft] = useState<number | null>(null)

  useEffect(() => {
    if(!selectedEmployee) return

    const employee = employees?.find(v => v.username === selectedEmployee)
    if(!employee) return

    fetch(`/api/absences/${employee.id}`)
    .then(response => {
      if(!response) {}
      return response.json()
    })
    .then(data => setDaysLeft(data.days))

  }, [selectedEmployee])
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user", { cache: "no-store" })
        if(!res.ok) {
          const error = await res.json()
          throw new Error(error ? error : "Failed to fetch users")
        }
        const data = await res.json();
        setEmployees(data.users);
      } catch (err) {
        console.error("Failed to fetch users:", err)
        flushError(err, "Failed to fetch users")
      }
      finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [])

  async function handleCreateAbsence() {
    if (!selectedEmployee || !startDate || !endDate || !absenceType) {
      flushError(new Error("Please fill in all fields"))
      return
    }

    const user = employees?.find((u) => u.username === selectedEmployee)
    if (!user) {
      flushError(new Error("Selected employee not found"))
      return;
    }

    try {
      const response = await fetch("/api/absences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          startDate: startDate,
          endDate: endDate,
          type: absenceType,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to create absence");
      // Reset form
      setSelectedEmployee(null);
      setStartDate("");
      setEndDate("")
      setAbsenceType(null);
      setDaysLeft(null)

      toast.success(data.message || "Absence created successfully!")
    } catch (error:unknown) {
      console.error( "Error creating absence:", error);
      flushError(error, "Error creating absence")
    }
  };

  if(isLoading) return <Spinner/>

  return (
    <div className="max-w-2/3 2xl:max-w-1/2">
      <h2 className="text-2xl text-[#244B77] font-bold mb-3 mt-5">
        Krijo lejet për punonjësit
      </h2>

      {/* Employee Selector */}
      <div className="flex justify-between items-center">
        <div className="w-1/2 mb-5">
          <Selector
            id="selector-employee"
            label="Selekto emrin e punonjësit"
            options={employees?.map((user) => user.username) || []}
            onChange={setSelectedEmployee}
            placeholder="Punonjësit"
            className={selectorStyle}
            value={selectedEmployee || ""}
          />
        </div>
        {typeof daysLeft === "number" && <div className="border-b-2 border-dotted border-b-[#244B77] text-sm h-fit text-[#244B77]">Vacations Left: <span className="font-bold">{daysLeft} {daysLeft === 1 ? "Day" : "Days"}</span></div>}
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
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
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
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* Absence Type Selector */}
      <div className="w-1/2 mt-5">
        <Selector
          id="selector-absence"
          label="Selekto tipin e lejes"
          options={absenceTypes}
          onChange={setAbsenceType}
          placeholder="Tipi i lejes"
          className={selectorStyle}
          value={absenceType || ""}
        />
      </div>

      <Button className="mt-10" onClick={handleCreateAbsence}>
        Krijo leje
      </Button>
    </div>
  );
}


      // {infoMessage && <div className="Info gap-2 my-4 border-4 border-[#244B77] text-[#244B77] bg-[#E3F0FF] rounded-md py-1 px-2">
      //   <div className="InfoHeader flex justify-between">
      //       <Sparkles />
      //     <button onClick={() => setInfoMessage(null)}>
      //       <X />
      //     </button>
      //   </div>
      //   <span className="block px-8 pb-4">{infoMessage}</span>
      // </div>}

      // {errorMessage && <div className="Error gap-2 my-4 border-4 border-red-500 text-red-500 bg-red-100 rounded-md py-1 px-2">
      //   <div className="InfoHeader flex justify-between">
      //       <MessageSquareWarning />
      //     <button onClick={() => setErrorMessage(null)}>
      //       <X />
      //     </button>
      //   </div>
      //   <span className="block px-8 pb-4">{errorMessage}</span>
      // </div>}