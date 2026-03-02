import { Absence, AbsenceType, ExtAbsence } from "@/types/absence";
import { Check, FilePenLine, Trash2, Calendar, Clock, Tag, User as UserIcon, X } from "lucide-react";
import React from "react";

type Props = {
  absence: ExtAbsence;
  index: number;
  user: { id: number; username: string; isActive: boolean };
  editingAbsence: Absence | null;
  isSaving: boolean;
  isDeleting: boolean;
  isHighlighted: boolean;
  absenceRowRef: (el: HTMLDivElement | null) => void;
  setEditingAbsence: React.Dispatch<React.SetStateAction<Absence | null>>;
  onEditSubmit: () => void;
  onDelete: (id: number) => void;
  formatDate: (dateStr: string) => string;
  getTypeBadge: (type: string) => string;
  t: {
    startDate: string;
    endDate: string;
    type: string;
    days: string;
    actions: string;
  };
};

const ABSENCE_TYPES: (keyof typeof AbsenceType)[] = ["VACATION", "SICK", "PERSONAL", "PARENTAL"];

export default function AbsenceCard({
  absence,
  index,
  user,
  editingAbsence,
  isSaving,
  isDeleting,
  isHighlighted,
  absenceRowRef,
  setEditingAbsence,
  onEditSubmit,
  onDelete,
  formatDate,
  getTypeBadge,
  t,
}: Props) {
  const isInactive = !user.isActive;
  const isEditing = editingAbsence?.id === absence.id;

  return (
    <div
      ref={absenceRowRef}
      className={`p-4 border border-slate-200 rounded-lg transition-all ${
        isHighlighted ? "bg-amber-50 ring-2 ring-amber-300" : isEditing ? "bg-blue-50 border-blue-300" : "bg-white"
      } ${isInactive ? "opacity-75" : ""}`}
    >
      {/* Header with user info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full ${isInactive ? "bg-slate-300" : "bg-gradient-to-br from-blue-200 to-indigo-300"} flex items-center justify-center`}>
            <UserIcon size={14} className={isInactive ? "text-slate-500" : "text-blue-700"} />
          </div>
          <div>
            <span className="font-semibold text-sm text-slate-900">{user.username}</span>
            {isInactive && <span className="text-xs text-slate-500 italic ml-2">(Inactive)</span>}
          </div>
        </div>
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
          {index + 1}
        </span>
      </div>

      {/* Start Date */}
      <div className="mb-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-1">
          <Calendar size={14} className="text-slate-500" />
          <span className="text-xs font-semibold uppercase text-slate-500">{t.startDate}</span>
        </div>
        {isEditing ? (
          <input
            type="date"
            value={editingAbsence.startDate.slice(0, 10)}
            onChange={(e) => setEditingAbsence({ ...editingAbsence, startDate: e.target.value })}
            className="w-[calc(100%-32px)] sm:w-full px-3 py-1.5 border border-blue-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 sm:ml-6"
          />
        ) : (
          <span className="text-slate-800 font-medium ml-0 sm:ml-6">{formatDate(absence.startDate)}</span>
        )}
      </div>

      {/* End Date */}
      <div className="mb-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-1">
          <Calendar size={14} className="text-slate-500" />
          <span className="text-xs font-semibold uppercase text-slate-500">{t.endDate}</span>
        </div>
        {isEditing ? (
          <input
            type="date"
            value={editingAbsence.endDate.slice(0, 10)}
            onChange={(e) => setEditingAbsence({ ...editingAbsence, endDate: e.target.value })}
            className="w-[calc(100%-32px)] sm:w-full px-3 py-1.5 border border-blue-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 sm:ml-6"
          />
        ) : (
          <span className="text-slate-800 font-medium ml-0 sm:ml-6">{formatDate(absence.endDate)}</span>
        )}
      </div>

      {/* Type */}
      <div className="mb-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-1">
          <Tag size={14} className="text-slate-500" />
          <span className="text-xs font-semibold uppercase text-slate-500">{t.type}</span>
        </div>
        {isEditing ? (
          <select
            value={editingAbsence.type}
            onChange={(e) => setEditingAbsence({ ...editingAbsence, type: e.target.value })}
            className="w-full px-3 py-1.5 border border-blue-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 sm:ml-6"
          >
            {ABSENCE_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        ) : (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ml-0 sm:ml-6 ${getTypeBadge(absence.type)}`}>
            {absence.type}
          </span>
        )}
      </div>

      {/* Days */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Clock size={14} className="text-slate-500" />
          <span className="text-xs font-semibold uppercase text-slate-500">{t.days}</span>
        </div>
        {isEditing ? (
          <span className="text-slate-500 text-sm italic ml-6">Days will be recalculated on save</span>
        ) : (
          <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-slate-100 text-slate-800 text-sm font-bold ml-0 sm:ml-6">
            {absence.days}
          </span>
        )}
      </div>

      {/* Actions */}
      {isEditing ? (
        <div className="flex gap-2">
          <button
            onClick={onEditSubmit}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <svg className="animate-spin size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <Check size={16} />
            )}
            Save
          </button>
          <button
            onClick={() => setEditingAbsence(null)}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={16} />
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => setEditingAbsence(absence)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <FilePenLine size={16} />
            Edit
          </button>
          <button
            onClick={() => onDelete(absence.id)}
            disabled={isDeleting}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <svg className="animate-spin size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <Trash2 size={16} />
            )}
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
