"use client";

import { User } from "@/types/user";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDown } from "lucide-react";

type DropdownValue = string | User

interface DropdownProps<T> {
  /**
   * If an array of objects is passed to the dropdown, in this function you define which propery it should render by
   * For Example: values = [{username:"Jack Smith", email:"jsmith@me.com"}, {username:"Tinna Olly", email:"tolly@me.com"}]
   * You can tell the dropdown to render by username like: formatValues: (value) => value.username
   * If the array is plain strings ["apple", "bannana", "orange"] then is simply: formatValues: (value) => value
   * @param value represent each option, which can be a string or object
   * @returns a string after proper calculation
   */
  formatValues: (value: T) => string
  /**
   * This function is helpful when an array of objects is passed into the dropdown, instead of an array of plain strings.
   * It defines how should the dropdown know which value was selected, to then be able to display it
   * @param value represent each option, which can be a string or object
   * @returns a string after proper calculation
   */
  selectedValue: (value: T | null) => string
  values: T[]
  value: T | null
  onSelect?: (value: T | null) => void
  /**
   * If you want to include an option which represents Select All options, but sometimes you might not need this option
   * then provide hasAll: false
   * This options `returns` `NULL`, so selectAll = `NULL` value so you should handle it properly
   */
  hasAllOption?:boolean
  isDisabled?:boolean
}

export default function Dropdown<T>({ 
  values, 
  value,
  formatValues, 
  selectedValue, 
  onSelect,
  hasAllOption = true,
  isDisabled
}: DropdownProps<T>) {

  function handleSelect(newValue: T | null) {
    if(onSelect) onSelect(newValue)
  }

  return (
    <div className="Dropdown flex w-fit ">
      <Menu as="div" className="relative inline-block text-inherit">
        <MenuButton disabled={isDisabled} className="inline-flex w-full outline-1 outline-black/5 items-center justify-center gap-x-1.5 px-3 py-2 text-sm font-semibold inset-ring-1 inset-ring-white/5 disabled:opacity-50">
          {selectedValue(value)}
          {!isDisabled && <ChevronDown className="w-4 h-4 ml-1" />}
        </MenuButton>

        <MenuItems className="absolute left-0 z-50 min-w-40 w-fit origin-top-left rounded-md bg-white shadow-[1px_2px_4px_rgba(0,0,0,0.25)] outline-none transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in">
          <div className="py-1">
            {hasAllOption && <MenuItem>
              <a
                href="#"
                onClick={() => handleSelect(null)}
                className={`block text-nowrap hover:bg-[#E3F0FF] px-4 py-2 text-sm data-focus:bg-white/5 data-focus:text-white data-focus:outline-hidden 
                  ${value === null && "bg-[#6C99CB] font-bold text-white"}
                `}
              >
                All
              </a>
            </MenuItem>}
            {values.map((v, i) => (
              <MenuItem key={i}>
                <a
                  href="#"
                  onClick={() => handleSelect(v)}
                  className={`block text-nowrap hover:bg-[#E3F0FF] px-4 py-2 text-sm data-focus:bg-white/5 data-focus:text-white data-focus:outline-hidden 
                    ${value === v && "bg-[#6C99CB] font-bold text-white"}
                  `}
                >
                  {formatValues(v)}
                </a>
              </MenuItem>
            ))}
          </div>
        </MenuItems>
      </Menu>
    </div>
  );
}
