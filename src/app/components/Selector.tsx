"use client";
import { useMemo, useRef, useEffect, memo, useState } from "react";

interface SelectorProps {
  id: string;
  label?: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  sorted?: boolean;
}

function Selector({
  id,
  label,
  options,
  value,
  onChange,
  placeholder = "Select an option",
  className,
  disabled = false,
  sorted = true,
}: SelectorProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const sortedOptions = useMemo(
    () => (sorted ? [...options].sort((a, b) => a.localeCompare(b)) : options),
    [options, sorted]
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen((prev) => !prev);
    }
  };

  const buttonClassName = className || "bg-[#244B77] text-white";

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
        aria-label={label ? `${label}: ${value || placeholder}` : undefined}
        className={`p-2 px-5 rounded-sm w-full flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 ${buttonClassName} ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <span>{value || placeholder}</span>
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
          className="absolute bg-white border border-gray-300 rounded-md mt-1 w-full z-10 max-h-60 overflow-y-auto shadow-lg custom-scrollbar"
        >
          {sortedOptions.map((option, index) => (
            <li
              key={`${option}-${index}`}
              role="option"
              tabIndex={0}
              aria-selected={option === value}
              onClick={() => handleSelect(option)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelect(option);
                }
              }}
              className={`relative p-2 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-400 ${
                option === value
                  ? "bg-[#244B77] text-white font-medium"
                  : "hover:bg-[#E3F0FF] text-slate-800"
              }`}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default memo(Selector);