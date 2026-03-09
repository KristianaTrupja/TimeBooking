"use client";

import { Absence, AbsenceType, ExtAbsence } from "@/types/absence";
import { User } from "@/types/user";
import { ArrowDown, ArrowUp, ArrowUpDown, CalendarX, Check, FilePenLine, Trash2, User as UserIcon, X } from "lucide-react";
import React from "react";
import AbsenceCard from "./AbsenceCard";
import { useIsMobile } from "@/app/hooks/useIsMobile";

type SortField = "startDate" | "endDate" | "type" | "days";
type SortDirection = "asc" | "desc" | null;

type Props = {
  containerHeight: number | null;
  absences: ExtAbsence[];
  employees: User[];
  editingAbsence: Absence | null;
  isSaving: boolean;
  deletingId: number | null;
  reviewingId: number | null;
  scrollToAbsence: { userId: number; startDate: string } | null;
  absenceRowRefs: React.MutableRefObject<Map<string, HTMLTableRowElement>>;
  sortField: SortField | null;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  sortAbsences: (absencesToSort: ExtAbsence[]) => ExtAbsence[];
  setEditingAbsence: React.Dispatch<React.SetStateAction<Absence | null>>;
  onEditSubmit: () => void;
  onDelete: (id: number) => void;
  onReview: (id: number, status: "APPROVED" | "REJECTED") => void;
  formatDate: (dateStr: string) => string;
  getTypeBadge: (type: string) => string;
  t: {
    noAbsencesFound: string;
    adjustFilters: string;
    startDate: string;
    endDate: string;
    type: string;
    days: string;
    actions: string;
    status: string;
    absence: string;
    absences: string;
  };
};

const ABSENCE_TYPES: (keyof typeof AbsenceType)[] = [
  "VACATION",
  "SICK",
  "PERSONAL",
  "PARENTAL",
  "MARRIAGE",
  "BEREAVEMENT",
];

export default function ModifyAbsencesListView({
  containerHeight,
  absences,
  employees,
  editingAbsence,
  isSaving,
  deletingId,
  reviewingId,
  scrollToAbsence,
  absenceRowRefs,
  sortField,
  sortDirection,
  onSort,
  sortAbsences,
  setEditingAbsence,
  onEditSubmit,
  onDelete,
  onReview,
  formatDate,
  getTypeBadge,
  t,
}: Props) {
  const isMobileLayout = useIsMobile(1024);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
      APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-300",
      REJECTED: "bg-rose-100 text-rose-700 border-rose-300",
    };
    return styles[status] || "bg-slate-100 text-slate-700 border-slate-300";
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown size={14} className="text-slate-400" />;
    if (sortDirection === "asc") return <ArrowUp size={14} className="text-[#244B77]" />;
    if (sortDirection === "desc") return <ArrowDown size={14} className="text-[#244B77]" />;
    return <ArrowUpDown size={14} className="text-slate-400" />;
  };

  return (
    <section
      className="overflow-y-auto rounded-xl flex-1 custom-scrollbar"
      style={{ maxHeight: !isMobileLayout ? (containerHeight ? `${containerHeight}px` : "66vh") : undefined }}
    >
      {!absences.length && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-200">
          <CalendarX size={48} className="text-slate-400 mb-3" aria-hidden="true" />
          <p className="text-lg font-semibold text-slate-700">{t.noAbsencesFound}</p>
          <p className="text-sm text-slate-500 font-medium">{t.adjustFilters}</p>
        </div>
      )}

      {employees.sort((a, b) => a.username.localeCompare(b.username)).map((user, userIndex) => {
        const userAbsences = absences.filter((a) => a.userId === user.id);
        if (userAbsences.length === 0) return null;
        const isInactive = !user.isActive;

        return (
          <div key={userIndex} className={`mb-5 bg-white rounded-xl sm:border sm:border-slate-200 sm:shadow-sm overflow-hidden ${isInactive ? "opacity-75" : ""}`}>
            <div className={`bg-gradient-to-r ${isInactive ? "from-slate-400 to-slate-500" : "from-[#244B77] to-[#1a3a5c]"} px-4 sm:px-5 py-3 flex items-center gap-2 sm:gap-3`}>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <UserIcon size={16} className="text-white" aria-hidden="true" />
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-white font-bold text-sm sm:text-base truncate">{user.username}</span>
                {isInactive && <span className="text-white/80 text-xs italic">(Inactive)</span>}
              </div>
              <span className="text-white/80 text-xs sm:text-sm font-medium flex-shrink-0">
                {userAbsences.length} {userAbsences.length === 1 ? t.absence : t.absences}
              </span>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full table-fixed">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr className="text-left text-xs uppercase tracking-wider text-slate-600">
                  <th className="px-4 py-3 font-bold bg-slate-100" style={{ width: "60px" }}>#</th>
                  <th className="px-4 py-3 font-bold bg-slate-100" style={{ width: "150px" }}>
                    <button onClick={() => onSort("startDate")} className="flex items-center gap-1.5 hover:text-slate-900 transition-colors">
                      {t.startDate} {getSortIcon("startDate")}
                    </button>
                  </th>
                  <th className="px-4 py-3 font-bold bg-slate-100" style={{ width: "150px" }}>
                    <button onClick={() => onSort("endDate")} className="flex items-center gap-1.5 hover:text-slate-900 transition-colors">
                      {t.endDate} {getSortIcon("endDate")}
                    </button>
                  </th>
                  <th className="px-4 py-3 font-bold bg-slate-100" style={{ width: "180px" }}>
                    <button onClick={() => onSort("type")} className="flex items-center gap-1.5 hover:text-slate-900 transition-colors">
                      {t.type} {getSortIcon("type")}
                    </button>
                  </th>
                  <th className="px-4 py-3 font-bold bg-slate-100" style={{ width: "100px" }}>
                    <button onClick={() => onSort("days")} className="flex items-center gap-1.5 hover:text-slate-900 transition-colors">
                      {t.days} {getSortIcon("days")}
                    </button>
                  </th>
                  <th className="px-4 py-3 font-bold text-center bg-slate-100" style={{ width: "120px" }}>{t.status}</th>
                  <th className="px-4 py-3 font-bold text-center bg-slate-100" style={{ width: "160px" }}>{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortAbsences(userAbsences).map((absence, index) => {
                  const absenceStartDate = new Date(absence.startDate).toISOString();
                  const isHighlighted = !!(scrollToAbsence && scrollToAbsence.userId === user.id && scrollToAbsence.startDate === absenceStartDate);
                  const rowKey = `${user.id}-${absenceStartDate}`;
                  const isEditing = editingAbsence?.id === absence.id;
                  const isPending = absence.status === "PENDING";
                  const isReviewing = reviewingId === absence.id;

                  return (
                    <tr
                      key={absence.id}
                      ref={(el) => {
                        if (el) absenceRowRefs.current.set(rowKey, el);
                      }}
                      className={`transition-all ${isHighlighted ? "bg-amber-50 ring-2 ring-inset ring-amber-300" : isEditing ? "bg-blue-50" : "hover:bg-slate-50"}`}
                    >
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">{index + 1}</span>
                      </td>

                      {isEditing ? (
                        <>
                          <td className="px-4 py-3">
                            <input
                              type="date"
                              value={editingAbsence.startDate.slice(0, 10)}
                              onChange={(e) => setEditingAbsence({ ...editingAbsence, startDate: e.target.value })}
                              aria-label="Start date"
                              className="px-3 py-1.5 border border-blue-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="date"
                              value={editingAbsence.endDate.slice(0, 10)}
                              onChange={(e) => setEditingAbsence({ ...editingAbsence, endDate: e.target.value })}
                              aria-label="End date"
                              className="px-3 py-1.5 border border-blue-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={editingAbsence.type}
                              onChange={(e) => setEditingAbsence({ ...editingAbsence, type: e.target.value })}
                              aria-label="Absence type"
                              className="px-3 py-1.5 border border-blue-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                            >
                              {ABSENCE_TYPES.map((type) => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-slate-500 text-sm italic" title="Days will be recalculated on save">—</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={onEditSubmit}
                                disabled={isSaving}
                                className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Save changes"
                              >
                                {isSaving ? (
                                  <svg className="animate-spin size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                ) : (
                                  <Check size={16} aria-hidden="true" />
                                )}
                              </button>
                              <button
                                onClick={() => setEditingAbsence(null)}
                                disabled={isSaving}
                                className="p-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Cancel editing"
                              >
                                <X size={16} aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3"><span className="text-slate-800 font-medium">{formatDate(absence.startDate)}</span></td>
                          <td className="px-4 py-3"><span className="text-slate-800 font-medium">{formatDate(absence.endDate)}</span></td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getTypeBadge(absence.type)}`}>{absence.type}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 text-sm font-bold" title="Business days (excludes weekends and holidays)">
                              {absence.days}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(absence.status)}`}>
                              {absence.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              {!isPending && (
                                <button
                                  onClick={() => setEditingAbsence(absence)}
                                  className="p-2 rounded-lg hover:bg-blue-100 text-slate-600 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
                                  aria-label={`Edit absence for ${user.username}`}
                                >
                                  <FilePenLine size={16} aria-hidden="true" />
                                </button>
                              )}
                              {isPending && (
                                <>
                                  <button
                                    onClick={() => onReview(absence.id, "APPROVED")}
                                    disabled={isReviewing}
                                    className="p-2 rounded-lg hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label={`Approve absence for ${user.username}`}
                                  >
                                    <Check size={16} aria-hidden="true" />
                                  </button>
                                  <button
                                    onClick={() => onReview(absence.id, "REJECTED")}
                                    disabled={isReviewing}
                                    className="p-2 rounded-lg hover:bg-amber-100 text-slate-600 hover:text-amber-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label={`Reject absence for ${user.username}`}
                                  >
                                    <X size={16} aria-hidden="true" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => onDelete(absence.id)}
                                disabled={deletingId === absence.id}
                                className="p-2 rounded-lg hover:bg-rose-100 text-slate-600 hover:text-rose-600 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label={`Delete absence for ${user.username}`}
                              >
                                {deletingId === absence.id ? (
                                  <svg className="animate-spin size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                ) : (
                                  <Trash2 size={16} aria-hidden="true" />
                                )}
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

            {/* Mobile Card View */}
            <div className="md:hidden sm:p-3 space-y-3">
              {sortAbsences(userAbsences).map((absence, index) => {
                const absenceStartDate = new Date(absence.startDate).toISOString();
                const isHighlighted = !!(scrollToAbsence && scrollToAbsence.userId === user.id && scrollToAbsence.startDate === absenceStartDate);
                const rowKey = `${user.id}-${absenceStartDate}`;

                return (
                  <AbsenceCard
                    key={absence.id}
                    absence={absence}
                    index={index}
                    user={user}
                    editingAbsence={editingAbsence}
                    isSaving={isSaving}
                    isDeleting={deletingId === absence.id}
                    isReviewing={reviewingId === absence.id}
                    isHighlighted={isHighlighted}
                    absenceRowRef={(el) => {
                      if (el) absenceRowRefs.current.set(rowKey, el as any);
                    }}
                    setEditingAbsence={setEditingAbsence}
                    onEditSubmit={onEditSubmit}
                    onDelete={onDelete}
                    onReview={onReview}
                    formatDate={formatDate}
                    getTypeBadge={getTypeBadge}
                    t={t}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}
