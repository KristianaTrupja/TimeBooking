"use client";
import Dropdown from "@/components/ui/Dropdown";
import { AbsenceType, ExtAbsence, Filters } from "@/types/absence";
import { User } from "@/types/user";
import { Funnel, FunnelX } from "lucide-react";
import DateFilter from "../date-filter/DateFilter";
import { useMemo } from "react";

type PropTypes = { 
  employees:User[]
  absences: ExtAbsence[]
  absenceTypes: (keyof typeof AbsenceType)[]
  filters:Filters
  onFiltersChange: (filters: Filters) => void
  onReset: () => void
  hasFilters: boolean
}

export default function FilterAbsences({
  absences, 
  employees,
  absenceTypes,
  filters,
  onFiltersChange,
  onReset,
  hasFilters
}:PropTypes) {
  function handleSelectedAbsence(value: keyof typeof AbsenceType | null){
    onFiltersChange({...filters, selectedAbsenceType:value})
  }

  function handleSelectedEmployee(value: User | null){
    onFiltersChange({...filters, selectedEmployee:value})
  }

  function handleDateChange(range: { startDate: Date; endDate: Date }) {
    onFiltersChange({...filters, startDate:range.startDate, endDate:range.endDate})
  }

  const totalAbsenceDays = useMemo(() => absences.reduce((acc, absence) => acc + absence.days, 0), [absences])

  return (
    <section className="flex flex-col sm:flex-row justify-between">
      <div className="AbsenceUserFilter flex flex-wrap  justify-between sm:flex-nowrap items-center w-fit text-[#244B77]">
        {hasFilters ? <button 
          title="Clear all filters" 
          onClick={onReset}
          aria-label="Clear all filters"
          className="focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1 rounded"
        >
          <FunnelX className="bg-red-500 py-1 rounded text-sm font-semibold hover:shadow-lg text-white" aria-hidden="true" />
        </button> :
        <Funnel className="inline-block text-[#244B77]" aria-hidden="true" />
        }
        <Dropdown 
        values={employees} 
        value={filters.selectedEmployee}
        formatValues={employee => employee.username} 
        selectedValue={employee => employee ? employee.username : "All Employees"} 
        onSelect={handleSelectedEmployee} 
        />
        <Dropdown 
        values={absenceTypes}
        value={filters.selectedAbsenceType} 
        formatValues={absence => absence} 
        selectedValue={absence => absence ? absence : "All Absences"}
        onSelect={handleSelectedAbsence}
        />
        
        <div className="text-sm font-medium border-b-2 border-b-[#6C99CB] px-2 py-1 text-slate-700">Days Off: <strong className="text-[#244B77]">{totalAbsenceDays}</strong></div>
      </div>
      <DateFilter onChange={handleDateChange} startDate={filters.startDate} endDate={filters.endDate} />
    </section>
  )
}
