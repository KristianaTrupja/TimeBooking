"use client";
import { Button } from "@/components/ui/button";
import { ProjectEntry } from "@/types/project";
import { Delete, FilePenLine, LoaderCircle, Save, ChevronDown, Building2, FileText } from "lucide-react";
import { useMemo, useRef, useEffect, memo, useState, MouseEvent } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/app/context/LanguageContext";

interface ProjectManageProps {
  id: string;
  label?: string;
  options: ProjectEntry[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  editable?: boolean;
  onOptionsModified?: (id: number, newValue: string, operation: 'update' | 'delete') => Promise<void>;
  value?: string;
}

function ProjectManage({
  id,
  label,
  options,
  placeholder = "View Options",
  className,
  disabled = false,
  onOptionsModified,
}: ProjectManageProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [pendingId, setPendingId] = useState<number | null>(null);
  const { t } = useLanguage();

  const sortedOptions = useMemo(
    () => [...options].sort((a, b) => a.project.localeCompare(b.project)),
    [options]
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Prevent closing dropdown during pending operations
        if (pendingId !== null) return;
        setIsOpen(false);
        setEditingId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, pendingId]);

  function onEdit(e: MouseEvent<HTMLButtonElement>, entry: ProjectEntry) {
    e.stopPropagation();
    setEditingId(entry.id);
    setEditValue(entry.project);
  }

  function onCancel(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    setEditingId(null);
    setEditValue("");
  }

  async function onSave(e: MouseEvent<HTMLButtonElement>, entry: ProjectEntry) {
    e.stopPropagation();
    
    if (!editValue.trim()) {
      setEditingId(null);
      setEditValue("");
      return;
    }

    if (editValue.trim() === entry.project) {
      setEditingId(null);
      setEditValue("");
      return;
    }

    if (onOptionsModified) {
      setPendingId(entry.id);
      try {
        await onOptionsModified(entry.id, editValue.trim(), 'update');
        toast.success(t.projectUpdated);
        setEditingId(null);
        setEditValue("");
      } catch (error: any) {
        toast.error(error.message || t.somethingWentWrong);
      } finally {
        setPendingId(null);
      }
    }
  }

  async function onDelete(e: MouseEvent<HTMLButtonElement>, entry: ProjectEntry) {
    e.stopPropagation()
    if(!window) return //implement some other confirmation deleting logic if not in browser

    const confirmed = confirm(t.confirmDelete)

    if (onOptionsModified && confirmed) {
      setPendingId(entry.id);
      try {
        await onOptionsModified(entry.id, entry.project, 'delete');
        toast.success(t.projectDeleted);
      } catch (error: any) {
        toast.error(error.message || t.somethingWentWrong);
      } finally {
        setPendingId(null);
      }
    }
  }

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen((prev) => !prev);
    }
  };

  const isAnyPending = pendingId !== null;

  return (
    <div ref={dropdownRef} className="relative">
      {/* Company Header Button */}
      <button
        onClick={toggleDropdown}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${id}-listbox`}
        className={`w-full flex items-center justify-between p-3 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 ${
          isOpen 
            ? "bg-gradient-to-r from-[#244B77] to-[#1a3a5c] text-white shadow-md" 
            : "bg-slate-100 hover:bg-slate-200 text-slate-800"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isOpen ? "bg-white/20" : "bg-slate-200"
          }`}>
            <Building2 size={16} className={isOpen ? "text-white" : "text-slate-700"} />
          </div>
          <div className="text-left">
            <span className="font-semibold">{label}</span>
            <span className={`ml-2 text-xs font-medium ${isOpen ? "text-white/80" : "text-slate-600"}`}>
              ({sortedOptions.length} {t.projects.toLowerCase()})
            </span>
          </div>
        </div>
        <ChevronDown 
          size={18} 
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} 
        />
      </button>

      {/* Projects Dropdown */}
      {isOpen && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          aria-labelledby={id}
          className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-lg z-50 max-h-64 overflow-y-auto custom-scrollbar"
        >
          {sortedOptions.map((option, index) => {
            const isInactive = !option.isActive;
            return (
            <li
              key={index}
              role="option"
              className={`group border-b border-slate-100 last:border-b-0 ${isInactive ? 'opacity-60' : ''}`}
            >
              {editingId === option.id ? (
                <div className="flex items-center gap-2 p-3 bg-blue-50">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                    disabled={pendingId === option.id}
                    className="flex-1 min-w-0 px-3 py-2 border border-blue-300 rounded-md bg-white text-slate-800 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && pendingId === null) {
                        onSave(e as any, option);
                      } else if (e.key === "Escape" && pendingId === null) {
                        onCancel(e as any);
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-blue-100"
                    onClick={(e) => onSave(e, option)}
                    disabled={pendingId === option.id}
                  >
                    {pendingId === option.id ? (
                      <LoaderCircle size={16} className="animate-spin text-blue-600" />
                    ) : (
                      <Save size={16} className="text-blue-600" />
                    )}
                  </Button>
                </div>
              ) : (
                <div className={`flex items-center justify-between p-3 transition-colors ${
                  isInactive ? 'bg-slate-200 hover:bg-slate-300' : 'hover:bg-slate-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <FileText size={14} className={isInactive ? "text-slate-400" : "text-slate-500"} />
                    <span className={`text-sm font-medium ${
                      isInactive ? 'text-slate-600' : 'text-slate-800'
                    } ${isAnyPending ? "opacity-50" : ""}`}>
                      {option.project}
                      {isInactive && <span className="ml-2 text-xs italic text-slate-500">(Inactive)</span>}
                    </span>
                  </div>
                  {pendingId === option.id ? (
                    <LoaderCircle size={16} className="animate-spin text-slate-600" />
                  ) : (
                    <div className={`flex gap-1 ${isAnyPending ? 'opacity-50 pointer-events-none' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                      <button
                        onClick={(e) => onEdit(e, option)}
                        className="p-1.5 rounded-md hover:bg-blue-100 text-slate-600 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                        aria-label={`Edit project: ${option.project}`}
                        disabled={isAnyPending || isInactive}
                      >
                        <FilePenLine size={14} aria-hidden="true" />
                      </button>
                      <button
                        onClick={(e) => onDelete(e, option)}
                        className="p-1.5 rounded-md hover:bg-rose-100 text-slate-600 hover:text-rose-600 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400"
                        aria-label={`Delete project: ${option.project}`}
                        disabled={isAnyPending}
                      >
                        <Delete size={14} aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          )})}

        </ul>
      )}
    </div>
  );
}

export default memo(ProjectManage);
