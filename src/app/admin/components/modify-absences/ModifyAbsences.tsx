import React, { useCallback, useEffect, useState } from "react";
import { FilePenLine, Delete } from "lucide-react";
import { User } from "@/types/user";
import { Absence, AbsenceType, ExtAbsence, Filters } from "@/types/absence";
import Spinner from "@/components/ui/Spinner";
import FilterAbsences from "../absence-filters/FilterAbsences";
import { getEndOfMonth } from "@/app/utils/dateUtils";

const ABSENCE_TYPES: (keyof typeof AbsenceType)[] = ["VACATION", "SICK", "PERSONAL", "PARENTAL"]

function getInitialFiltersState(): Filters {
  const now = new Date();
  return {
    selectedAbsenceType: null,
    selectedEmployee: null,
    startDate: new Date(now.getFullYear(), 0, 1),
    endDate: getEndOfMonth(now)
  }
}


export default function ModifyAbsences() {
  const now = new Date()

  const [employees, setEmployees] = useState<User[]>([]);
  const [absences, setAbsences] = useState<ExtAbsence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingAbsence, setEditingAbsence] = useState<Absence | null>(null);
  const [filters, setFilters] = useState<Filters>(getInitialFiltersState())

  const fetchData = useCallback(async () => {
    try {
      const start = filters.startDate.toISOString().slice(0, 10)
      const end = filters.endDate.toISOString().slice(0, 10)
      const params: URLSearchParams = new URLSearchParams()
      params.append("startDate", start)
      params.append("endDate", end)
      params.append("userId", filters.selectedEmployee?.id ? String(filters.selectedEmployee.id) :  "")
      params.append("absenceType", filters.selectedAbsenceType || "")

      const [absRes, userRes] = await Promise.all([
        fetch(`/api/absences?${params.toString()}`, { cache: "no-store" }),
        fetch("/api/user", { cache: "no-store" }),
      ]);

      const absData = await absRes.json();
      const userData = await userRes.json();

      setAbsences(absData.absences || []);
      setEmployees(userData.users || []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setTimeout(() => setIsLoading(false), 300);
    }
  }, [filters])


  useEffect(() => {
    fetchData()
  }, [filters])

  function handleOnFiltersChange(filters:Filters) {
    setFilters(filters)
  }

  function handleFiltersReset(){
    setFilters(getInitialFiltersState())
  }

  const hasFiltersApplied = useCallback(() => {
    const initial = getInitialFiltersState();
    return (
      filters.selectedAbsenceType !== null ||
      filters.selectedEmployee !== null ||
      filters.startDate.getTime() !== initial.startDate.getTime() ||
      filters.endDate.getTime() !== initial.endDate.getTime()
    );
  }, [filters])

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("sq-AL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  // const getUsername = (userId: string | number) =>
  //   employees.find((user) => user.id === Number(userId))?.username || "—";

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this absence?")) return;

    try {
      const res = await fetch(`/api/absences?id=${id}`, { method: "DELETE" });

      if (res.ok) {
        setAbsences((prev) => prev.filter((a) => a.id !== id));
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete absence");
      }
    } catch (err) {
      console.error("Error deleting absence:", err);
    }
  };

  const handleEditSubmit = async () => {
    if (!editingAbsence) return;

    try {
      const res = await fetch("/api/absences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingAbsence),
      });

      if (res.ok) {
        const updated = await res.json();
        setAbsences((prev) =>
          prev.map((a) =>
            a.id === updated.absence.id ? updated.absence : a
          )
        );
        setEditingAbsence(null);
      } else {
        const data = await res.json();
        alert(data.message || "Update failed");
      }
    } catch (err) {
      console.error("Update error:", err);
    }
  }

  return (
    <section>
      <section className="Filters">
        <FilterAbsences
          absences={absences}
          employees={employees} 
          absenceTypes={ABSENCE_TYPES}
          filters={filters}
          hasFilters={hasFiltersApplied()}
          onReset={handleFiltersReset}
          onFiltersChange={handleOnFiltersChange}
        />
      </section>
      {isLoading ? <Spinner /> : <section className="ReportedDate overflow-y-auto max-h-[450px] 2xl:max-h-[700px] pb-10 rounded-md">
        {!absences.length && <h2 className="font-bold text-[#244B77] italic text-2xl bg-slate-100 rounded-md text-center mt-10">No absences</h2>}
        {employees.sort((a, b) => a.username.localeCompare(b.username)).map((user, index) => {
          const userAbsences = absences.filter((a) => a.userId === user.id);
          if (userAbsences.length === 0) return null;
          return (
            <table
              key={index}
              className="w-full text-[#244B77] border-separate"
              style={{ borderSpacing: "10px" }}
            >
              {/* User Group Header Row */}
              <thead className="bg-[#244B77] text-white font-semibold">
                <tr>
                  <th colSpan={7} className="px-4 py-2 text-lg">
                    {user.username}
                  </th>
                </tr>
              </thead>
              <thead className="bg-[#6C99CB] text-white">
                <tr className="text-left">
                  <th className="px-4 py-2 w-16">Nr</th>
                  <th className="px-4 py-2 w-1/4">Punonjesi</th>
                  <th className="px-4 py-2 w-1/4">Data e fillimit</th>
                  <th className="px-4 py-2 w-1/4">Data e mbarimit</th>
                  <th className="px-4 py-2 w-1/4">Tipi</th>
                  <th className="px-4 py-2 w-1/4">Edito</th>
                  <th className="px-4 py-2 w-1/4">Fshij</th>
                </tr>
              </thead>
              <tbody>
                {/* User Absences */}
                {userAbsences.map((absence, index) =>
                  editingAbsence?.id === absence.id ? (
                    <tr key={absence.id} className="bg-yellow-100">
                      <td className="px-4 py-2">{index + 1}.</td>
                      <td className="px-4 py-2">{user.username}</td>
                      <td className="px-4 py-2">
                        <input
                          type="date"
                          value={editingAbsence.startDate.slice(0, 10)}
                          onChange={(e) =>
                            setEditingAbsence({
                              ...editingAbsence,
                              startDate: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="date"
                          value={editingAbsence.endDate.slice(0, 10)}
                          onChange={(e) =>
                            setEditingAbsence({
                              ...editingAbsence,
                              endDate: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={editingAbsence.type}
                          onChange={(e) =>
                            setEditingAbsence({
                              ...editingAbsence,
                              type: e.target.value,
                            })
                          }
                          className="p-1 border border-gray-300 rounded-md w-full"
                        >
                          {ABSENCE_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2 text-blue-800">
                        <button onClick={handleEditSubmit}>Save</button>
                      </td>
                      <td className="px-4 py-2 text-gray-800">
                        <button onClick={() => setEditingAbsence(null)}>Cancel</button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={absence.id} className="border-t border-[#d1d1d1] font-semibold text-lg bg-[#E3F0FF]">
                      <td className="px-4 py-2 bg-[#244B77] text-white font-semibold rounded-sm text-xl">
                        {index + 1}.
                      </td>
                      <td className="px-4 py-2">{user.username}</td>
                      <td className="px-4 py-2">{formatDate(absence.startDate)}</td>
                      <td className="px-4 py-2">{formatDate(absence.endDate)}</td>
                      <td className="px-4 py-2">{absence.type}</td>
                      <td className="px-4 py-2 text-green-800">
                        <button onClick={() => setEditingAbsence(absence)}>
                          <FilePenLine />
                        </button>
                      </td>
                      <td className="px-4 py-2 text-red-800">
                        <button onClick={() => handleDelete(absence.id)}>
                          <Delete />
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          );
        })}
      </section>}
    </section>
  );
}
