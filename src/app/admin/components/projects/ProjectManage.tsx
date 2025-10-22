"use client";
import { Button } from "@/components/ui/button";
import { ProjectEntry } from "@/types/project";
import { Delete, FilePenLine, LoaderCircle, Save } from "lucide-react";
import { useMemo, useRef, useEffect, memo, useState, MouseEvent } from "react";
import { toast } from "sonner";

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
        toast.success("Project updated successfully.");
        setEditingId(null);
        setEditValue("");
      } catch (error: any) {
        toast.error(error.message || "Error updating the project!");
      } finally {
        setPendingId(null);
      }
    }
  }

  async function onDelete(e: MouseEvent<HTMLButtonElement>, entry: ProjectEntry) {
    e.stopPropagation()
    if(!window) return //implement some other confirmation deleting logic if not in browser

    const confirmed = confirm("Are you sure you want to delete this project?")

    if (onOptionsModified && confirmed) {
      setPendingId(entry.id);
      try {
        await onOptionsModified(entry.id, entry.project, 'delete');
        toast.success("Project deleted successfully.");
      } catch (error: any) {
        toast.error(error.message || "Error deleting the project!");
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

  const buttonClassName = className || "bg-[#244B77] text-white";
  const isAnyPending = pendingId !== null; // Check if any operation is pending

  return (
    <div ref={dropdownRef} className="relative">
      {label && (
        <label htmlFor={id} className="text-[#244B77] font-semibold mb-1 block">
          {label}
        </label>
      )}

      <button
        onClick={toggleDropdown}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${id}-listbox`}
        className={`p-2 px-5 rounded-sm w-full flex justify-between items-center ${buttonClassName} ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <span>{placeholder}</span>
        <span
          className={`ml-2 transform transition-transform ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
          aria-hidden="true"
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          aria-labelledby={id}
          className="absolute bg-white border border-gray-300 rounded-md mt-1 w-full z-10 max-h-60 overflow-y-auto shadow-lg"
        >
          {sortedOptions.map((option, index) => (
            <li
              key={index}
              role="option"
              className="group relative p-2 cursor-pointer transition-colors hover:bg-[#E3F0FF] text-[#244B77]"
            >
              {editingId === option.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                    disabled={pendingId === option.id}
                    className="flex-1 p-1 border rounded-sm bg-white text-black disabled:opacity-50"
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
                    className="h-auto p-1"
                    onClick={(e) => onSave(e, option)}
                    disabled={pendingId === option.id}
                  >
                    {pendingId === option.id ? (
                      <LoaderCircle size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <span className={isAnyPending ? "opacity-50" : ""}>
                    {option.project}
                  </span>
                  {pendingId === option.id ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <div className={`flex gap-1 ${isAnyPending ? 'opacity-50 pointer-events-none' : 'invisible group-hover:visible'}`}>
                      <button
                        onClick={(e) => onEdit(e, option)}
                        className="text-sm hover:text-black p-1"
                        aria-label="Edit project"
                        disabled={isAnyPending}
                      >
                        <FilePenLine size={16} />
                      </button>
                      <button
                        onClick={(e) => onDelete(e, option)}
                        className="text-sm hover:text-black p-1"
                        aria-label="Delete project"
                        disabled={isAnyPending}
                      >
                        <Delete size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default memo(ProjectManage);
