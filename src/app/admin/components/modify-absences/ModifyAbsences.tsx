import React, { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { FilePenLine, Trash2, CalendarX, User as UserIcon, Calendar, Check, X, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

type SortField = "startDate" | "endDate" | "type";
type SortDirection = "asc" | "desc" | null;
import { User } from "@/types/user";
import { Absence, AbsenceType, ExtAbsence, Filters } from "@/types/absence";
import Spinner from "@/components/ui/Spinner";
import FilterAbsences from "../absence-filters/FilterAbsences";
import { getEndOfMonth } from "@/app/utils/dateUtils";
import { toast } from "sonner";

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
  const searchParams = useSearchParams();

  const [employees, setEmployees] = useState<User[]>([]);
  const [absences, setAbsences] = useState<ExtAbsence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingAbsence, setEditingAbsence] = useState<Absence | null>(null);
  const [filters, setFilters] = useState<Filters>(getInitialFiltersState());
  const [containerHeight, setContainerHeight] = useState<number | null>(null);
  const [scrollToAbsence, setScrollToAbsence] = useState<{ userId: number; startDate: string } | null>(null);
  const [hasProcessedParams, setHasProcessedParams] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>("startDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const sectionRef = useRef<HTMLElement>(null);
  const filtersRef = useRef<HTMLElement>(null);
  const absenceRowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  // Handle URL params for scrolling to specific absence
  useEffect(() => {
    if (hasProcessedParams) return;
    
    const highlightUserIdParam = searchParams.get("highlightUserId");
    const startDateParam = searchParams.get("startDate");
    
    if (highlightUserIdParam && startDateParam) {
      setScrollToAbsence({
        userId: parseInt(highlightUserIdParam),
        startDate: startDateParam
      });
      setHasProcessedParams(true);
    } else {
      setHasProcessedParams(true);
    }
  }, [searchParams, hasProcessedParams]);

  // Scroll to the specific absence row when data is loaded
  useEffect(() => {
    if (scrollToAbsence && !isLoading) {
      const key = `${scrollToAbsence.userId}-${scrollToAbsence.startDate}`;
      const rowElement = absenceRowRefs.current.get(key);
      if (rowElement) {
        setTimeout(() => {
          rowElement.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });
        }, 100);
      }
    }
  }, [scrollToAbsence, isLoading, absences]);

  const calculateHeight = useCallback(() => {
    if (sectionRef.current && filtersRef.current) {
      const sectionTop = sectionRef.current.getBoundingClientRect().top;
      const filtersStyles = window.getComputedStyle(filtersRef.current);
      const filtersHeight = filtersRef.current.offsetHeight + 
        parseFloat(filtersStyles.marginTop) + parseFloat(filtersStyles.marginBottom);
      const bottomPadding = 24;
      const availableHeight = window.innerHeight - sectionTop - filtersHeight - bottomPadding;
      setContainerHeight(Math.max(availableHeight, 200));
    }
  }, []);

  useEffect(() => {
    calculateHeight();
    window.addEventListener("resize", calculateHeight);
    return () => window.removeEventListener("resize", calculateHeight);
  }, [calculateHeight, isLoading]);

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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

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
        toast.error(data.message || "Failed to delete absence");
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
        toast.error(data.message || "Update failed");
      }
    } catch (err) {
      console.error("Update error:", err);
    }
  }

  // Get absence type badge color
  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      VACATION: "bg-teal-100 text-teal-700 border-teal-300",
      SICK: "bg-rose-100 text-rose-700 border-rose-300",
      PERSONAL: "bg-violet-100 text-violet-700 border-violet-300",
      PARENTAL: "bg-amber-100 text-amber-700 border-amber-300",
    };
    return styles[type] || "bg-slate-100 text-slate-700 border-slate-300";
  };

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortField(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }, [sortField, sortDirection]);

  const getSortIcon = useCallback((field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={14} className="text-slate-400" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp size={14} className="text-[#244B77]" />;
    }
    if (sortDirection === "desc") {
      return <ArrowDown size={14} className="text-[#244B77]" />;
    }
    return <ArrowUpDown size={14} className="text-slate-400" />;
  }, [sortField, sortDirection]);

  const sortAbsences = useCallback((absencesToSort: ExtAbsence[]) => {
    if (!sortField || !sortDirection) {
      return [...absencesToSort].sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
    }

    return [...absencesToSort].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case "startDate":
          comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
          break;
        case "endDate":
          comparison = new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
          break;
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
      }
      
      return sortDirection === "desc" ? -comparison : comparison;
    });
  }, [sortField, sortDirection]);

  return (
    <section ref={sectionRef} className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-md shadow-rose-400/20">
            <CalendarX className="text-white" size={20} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Absence Records</h1>
            <p className="text-sm text-slate-600">View and manage employee absences</p>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-slate-100 rounded-xl flex items-center gap-2 border border-slate-200" title="Total Records">
            <Calendar size={16} className="text-slate-600" aria-hidden="true" />
            <span className="text-slate-800 font-bold">{absences.length}</span>
            <span className="text-slate-600 text-sm font-medium">records</span>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <section ref={filtersRef} className="mb-5 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
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

      {/* Table Section */}
      {isLoading ? (
        <div className="flex-1">
          <Spinner text="Loading absences..." />
        </div>
      ) : (
        <section
          className="overflow-y-auto rounded-xl flex-1 custom-scrollbar"
          style={{ maxHeight: containerHeight ? `${containerHeight}px` : "66vh" }}
        >
          {!absences.length && (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-200">
              <CalendarX size={48} className="text-slate-400 mb-3" aria-hidden="true" />
              <p className="text-lg font-semibold text-slate-700">No absences found</p>
              <p className="text-sm text-slate-500 font-medium">Try adjusting your filters</p>
            </div>
          )}
         
          {employees.sort((a, b) => a.username.localeCompare(b.username)).map((user, userIndex) => {
            const userAbsences = absences.filter((a) => a.userId === user.id);

            if (userAbsences.length === 0) return null;

            return (
              <div key={userIndex} className="mb-5 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* User Header */}
                <div className="bg-gradient-to-r from-[#244B77] to-[#1a3a5c] px-5 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <UserIcon size={16} className="text-white" aria-hidden="true" />
                  </div>
                  <span className="text-white font-bold">{user.username}</span>
                  <span className="ml-auto text-white/80 text-sm font-medium">{userAbsences.length} {userAbsences.length === 1 ? "absence" : "absences"}</span>
                </div>
                
                {/* Table */}
                <table className="w-full">
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr className="text-left text-xs uppercase tracking-wider text-slate-600">
                      <th className="px-4 py-3 font-bold w-12 bg-slate-100">#</th>
                      <th className="px-4 py-3 font-bold bg-slate-100">
                        <button 
                          onClick={() => handleSort("startDate")}
                          className="flex items-center gap-1.5 hover:text-slate-900 transition-colors"
                        >
                          Start Date {getSortIcon("startDate")}
                        </button>
                      </th>
                      <th className="px-4 py-3 font-bold bg-slate-100">
                        <button 
                          onClick={() => handleSort("endDate")}
                          className="flex items-center gap-1.5 hover:text-slate-900 transition-colors"
                        >
                          End Date {getSortIcon("endDate")}
                        </button>
                      </th>
                      <th className="px-4 py-3 font-bold bg-slate-100">
                        <button 
                          onClick={() => handleSort("type")}
                          className="flex items-center gap-1.5 hover:text-slate-900 transition-colors"
                        >
                          Type {getSortIcon("type")}
                        </button>
                      </th>
                      <th className="px-4 py-3 font-bold text-center bg-slate-100">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortAbsences(userAbsences).map((absence, index) => {
                      const absenceStartDate = new Date(absence.startDate).toISOString();
                      const isHighlighted = scrollToAbsence && 
                        scrollToAbsence.userId === user.id && 
                        scrollToAbsence.startDate === absenceStartDate;
                      const rowKey = `${user.id}-${absenceStartDate}`;
                      const isEditing = editingAbsence?.id === absence.id;
                      
                      return (
                        <tr 
                          key={absence.id} 
                          ref={(el) => {
                            if (el) absenceRowRefs.current.set(rowKey, el);
                          }}
                          className={`transition-all ${
                            isHighlighted 
                              ? "bg-amber-50 ring-2 ring-inset ring-amber-300" 
                              : isEditing
                              ? "bg-blue-50"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                              {index + 1}
                            </span>
                          </td>
                          
                          {isEditing ? (
                            <>
                              <td className="px-4 py-3">
                                <input
                                  type="date"
                                  value={editingAbsence.startDate.slice(0, 10)}
                                  onChange={(e) =>
                                    setEditingAbsence({
                                      ...editingAbsence,
                                      startDate: e.target.value,
                                    })
                                  }
                                  aria-label="Start date"
                                  className="px-3 py-1.5 border border-blue-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="date"
                                  value={editingAbsence.endDate.slice(0, 10)}
                                  onChange={(e) =>
                                    setEditingAbsence({
                                      ...editingAbsence,
                                      endDate: e.target.value,
                                    })
                                  }
                                  aria-label="End date"
                                  className="px-3 py-1.5 border border-blue-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <select
                                  value={editingAbsence.type}
                                  onChange={(e) =>
                                    setEditingAbsence({
                                      ...editingAbsence,
                                      type: e.target.value,
                                    })
                                  }
                                  aria-label="Absence type"
                                  className="px-3 py-1.5 border border-blue-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                                >
                                  {ABSENCE_TYPES.map((type) => (
                                    <option key={type} value={type}>
                                      {type}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-2">
                                  <button 
                                    onClick={handleEditSubmit} 
                                    className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1"
                                    aria-label="Save changes"
                                  >
                                    <Check size={16} aria-hidden="true" />
                                  </button>
                                  <button 
                                    onClick={() => setEditingAbsence(null)} 
                                    className="p-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
                                    aria-label="Cancel editing"
                                  >
                                    <X size={16} aria-hidden="true" />
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-3">
                                <span className="text-slate-800 font-medium">{formatDate(absence.startDate)}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-slate-800 font-medium">{formatDate(absence.endDate)}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getTypeBadge(absence.type)}`}>
                                  {absence.type}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-1">
                                  <button 
                                    onClick={() => setEditingAbsence(absence)} 
                                    className="p-2 rounded-lg hover:bg-blue-100 text-slate-600 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
                                    aria-label={`Edit absence for ${user.username}`}
                                  >
                                    <FilePenLine size={16} aria-hidden="true" />
                                  </button>
                                  <button 
                                    onClick={() => handleDelete(absence.id)} 
                                    className="p-2 rounded-lg hover:bg-rose-100 text-slate-600 hover:text-rose-600 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-1"
                                    aria-label={`Delete absence for ${user.username}`}
                                  >
                                    <Trash2 size={16} aria-hidden="true" />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </section>
      )}
    </section>
  );
}
