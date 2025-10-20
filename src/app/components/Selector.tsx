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
}: SelectorProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Memoize sorted options to avoid re-sorting on every render
  const sortedOptions = useMemo(
    () => [...options].sort((a, b) => a.localeCompare(b)),
    [options]
  );

  // Close dropdown when clicking outside
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

  // Handle keyboard navigation
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
        className={`p-2 px-5 rounded-sm w-full flex justify-between items-center ${buttonClassName} ${
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
          className="absolute bg-white border border-gray-300 rounded-md mt-1 w-full z-10 max-h-60 overflow-y-auto shadow-lg"
        >
          {sortedOptions.map((option, index) => (
            <li
              key={`${option}-${index}`}
              role="option"
              aria-selected={option === value}
              onClick={() => handleSelect(option)}
              className={`relative p-2 cursor-pointer transition-colors ${
                option === value
                  ? "bg-[#244B77] text-white"
                  : "hover:bg-[#E3F0FF] text-[#244B77]"
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









// "use client";
// import { ReactEventHandler, useEffect, useState } from "react";
// import { Delete, FilePenLine, Save } from "lucide-react";
// import { Button } from "@/components/ui/button";

// interface SelectorProps {
//   id: string;
//   label: string;
//   options: string[];
//   onChange: (value: string) => void;
//   defaultValue?: string;
//   isOpen: boolean;
//   className?: string;
//   onToggle: () => void;
//   handleDelete: (company: string, project: string) => void;
//   variant?: string;
//   value?:string;
// }

// export default function Selector({
//   label,
//   options: initialOptions,
//   onChange,
//   defaultValue = "",
//   isOpen,
//   className,
//   onToggle,
//   handleDelete,
//   variant,
//   value
// }: SelectorProps) {
//   const [selected, setSelected] = useState(defaultValue);
//   const [options, setOptions] = useState<string[]>([]);
//   useEffect(() => {
//     setOptions(initialOptions);
//   }, [initialOptions]);

//   const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
//   const [editingIndex, setEditingIndex] = useState<number | null>(null);
//   const [editingValue, setEditingValue] = useState("");

//   const handleSelect = (value: string) => {
//     setSelected(value);
//     onChange(value);
//     onToggle(); // close dropdown
//   };

//   const handleEditClick = (index: number) => {
//     setEditingIndex(index);
//     setEditingValue(options[index]);
//   };
//   const handleDeleteClick = (index: number) => {
//     // setDeletingIndex(index);
//     // setDeletingValue(options[index]);
//     handleDelete(label, options[index]);
//   };

//   const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setEditingValue(e.target.value);
//   };

//   const handleEditBlur = () => {
//     if (editingIndex !== null) {
//       const updatedOptions = [...options];

//       if (editingValue.trim() === "") {
//         // Remove the option if input is empty
//         updatedOptions.splice(editingIndex, 1);

//         // Also deselect if the removed option was selected
//         if (options[editingIndex] === selected) {
//           setSelected("");
//           onChange("");
//         }
//       } else {
//         // Otherwise, update the value
//         updatedOptions[editingIndex] = editingValue;

//         if (options[editingIndex] === selected) {
//           setSelected(editingValue);
//           onChange(editingValue);
//         }
//       }

//       setOptions(updatedOptions);
//       setEditingIndex(null);
//     }
//   };

//   return (
//     <div className="relative mb-3">
//       {label && (
//         <label htmlFor={label} className="text-[#244B77] font-semibold mb-1">
//           {label}
//         </label>
//       )}

//       <button
//         onClick={onToggle}
//         id={label}
//         className={`p-2 px-5 rounded-sm w-full flex justify-between items-center ${
//           className || "bg-[#244B77] text-[#FFFF]"
//         }`}
//       >
//         {selected || "Select an option"}
//         <span
//           className={`ml-2 transform ${isOpen ? "rotate-180" : "rotate-0"}`}
//         >
//           ▼
//         </span>
//       </button>

//       {isOpen && variant !== "absences" && (
//         <ul className="absolute bg-[#E7E7E7] border border-gray-300 rounded-md mt-1 w-full z-10 max-h-60 overflow-y-auto">
//           {options.sort((a, b) => a.localeCompare(b)).map((option, index) => (
//             <li
//               key={index}
//               onClick={() => handleSelect(option)}
//               onMouseEnter={() => setHoveredIndex(index)}
//               onMouseLeave={() => setHoveredIndex(null)}
//               className="relative p-2 border-b border-gray-300 hover:bg-[#E0F6E5] cursor-pointer last:border-b-0"
//             >
//               {editingIndex === index ? (
//                 <div>
//                   <input
//                     type="text"
//                     value={editingValue}
//                     onChange={handleEditChange}
//                     onBlur={handleEditBlur}
//                     autoFocus
//                     className="w-full p-1 border rounded-sm bg-white"
//                     onClick={(e) => e.stopPropagation()}
//                   />
//                   <Button
//                     size="sm"
//                     variant="link"
//                     className="absolute right-2"
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       handleEditClick(index);
//                     }}
//                   >
//                     <Save />
//                   </Button>
//                 </div>
//               ) : (
//                 <div className="flex justify-between items-center">
//                   <span>{option}</span>
//                   {hoveredIndex === index && (
//                     <div>
//                       <button
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           handleEditClick(index);
//                         }}
//                         className="text-sm text-gray-600 ml-2 hover:text-black"
//                       >
//                         <FilePenLine size={16} />
//                       </button>
//                       <button
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           handleDeleteClick(index);
//                         }}
//                         className="text-sm text-gray-600 ml-2 hover:text-black"
//                       >
//                         <Delete size={16} />
//                       </button>
//                     </div>
//                   )}
//                 </div>
//               )}
//             </li>
//           ))}
//         </ul>
//       )}
//       {isOpen && variant === "absences" && (
//         <ul className="absolute bg-white border border-gray-300 rounded-md mt-1 w-full z-10 max-h-60 overflow-y-auto">
//           {options.sort((a, b) => a.localeCompare(b)).map((option, index) => (
//             <li
//               key={index}
//               onClick={() => handleSelect(option)}
//               onMouseEnter={() => setHoveredIndex(index)}
//               onMouseLeave={() => setHoveredIndex(null)}
//               className="bg-[#E3F0FF] text-[#244B77] relative p-2 hover:bg-[#244B77] hover:text-white cursor-pointer last:border-b-0 my-2 mx-3 rounded-md"
//             >
//               <div className="flex justify-between items-center">
//                 <span>{option}</span>
//               </div>
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );
// }
