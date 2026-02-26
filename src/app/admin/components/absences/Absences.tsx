"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import Selector from "@/app/components/Selector";
import { User } from "@/types/user";
import Spinner from "@/components/ui/Spinner";
import { AbsenceType } from "@/types/absence";
import { flushError } from "@/app/utils/flushError";
import { toast } from "sonner";
import { getBusinessDays } from "@/app/utils/dateUtils";
import { useLanguage } from "@/app/context/LanguageContext";
import { 
  CalendarDays, 
  Send, 
  Users, 
  UserRound,
  Palmtree, 
  Stethoscope, 
  Baby,
  Sparkles,
  TrendingUp,
  Clock
} from "lucide-react";

type APIRemainingDays = {
    currentYear: { year:number, daysLeft:number, daysSpent:number },
    lastYear: { year:number, daysLeft:number, daysSpent:number }
    totalDaysLeft: number
}

const absenceTypes: (keyof typeof AbsenceType)[] = ["VACATION", "SICK", "PERSONAL", "PARENTAL"]

const leaveTypeStyles: Record<string, { icon: React.ReactNode; gradient: string; glow: string; softBg: string; softText: string }> = {
  VACATION: { icon: <Palmtree size={20} />, gradient: "from-teal-400 to-emerald-400", glow: "shadow-teal-400/20", softBg: "bg-teal-50", softText: "text-teal-600" },
  SICK: { icon: <Stethoscope size={20} />, gradient: "from-rose-400 to-pink-400", glow: "shadow-rose-400/20", softBg: "bg-rose-50", softText: "text-rose-500" },
  PERSONAL: { icon: <UserRound size={20} />, gradient: "from-violet-400 to-purple-400", glow: "shadow-violet-400/20", softBg: "bg-violet-50", softText: "text-violet-500" },
  PARENTAL: { icon: <Baby size={20} />, gradient: "from-amber-400 to-orange-400", glow: "shadow-amber-400/20", softBg: "bg-amber-50", softText: "text-amber-500" },
}

export default function Absences() {
  const { t } = useLanguage();
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [absenceType, setAbsenceType] = useState<string | null>(null)
  const [employees, setEmployees] = useState<User[]| null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [remainingDays, setRemainingDays] = useState<APIRemainingDays | null>(null)
  const [holidays, setHolidays] = useState<string[]>([])
  
  // Translation map for absence types - memoized to update when language changes
  const absenceTypeLabels = useMemo<Record<string, string>>(() => ({
    VACATION: t.vacation,
    SICK: t.sick,
    PERSONAL: t.personal,
    PARENTAL: t.parental,
  }), [t]);

  useEffect(() => {
    if(!selectedEmployee) return
    setRemainingDays(null)

    const employee = employees?.find(v => v.username === selectedEmployee)
    if(!employee) return

    fetch(`/api/absences/${employee.id}`)
    .then(response => {
      if(!response) {}
      return response.json()
    })
    .then(data => setRemainingDays(data))

  }, [selectedEmployee])
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, holidayRes] = await Promise.all([
          fetch("/api/user", { cache: "no-store" }),
          fetch("/api/holidays", { cache: "no-store" })
        ]);

        if(!userRes.ok) {
          const error = await userRes.json()
          throw new Error(error ? error : t.somethingWentWrong)
        }

        const userData = await userRes.json();
        setEmployees(userData.users);

        if(holidayRes.ok) {
          const holidayData = await holidayRes.json();
          // Extract holiday dates as strings (YYYY-MM-DD format)
          const holidayDates = holidayData.holidays?.map((h: { date: string }) => 
            new Date(h.date).toISOString().split('T')[0]
          ) || [];
          setHolidays(holidayDates);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err)
        flushError(err, t.somethingWentWrong)
      }
      finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  async function handleCreateAbsence() {
    if (!selectedEmployee || !startDate || !endDate || !absenceType) {
      flushError(new Error(t.pleaseFillAllFields))
      return
    }

    const user = employees?.find((u) => u.username === selectedEmployee)
    if (!user) {
      flushError(new Error(t.selectedEmployeeNotFound))
      return;
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/absences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          startDate: startDate,
          endDate: endDate,
          type: absenceType,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || t.failedToCreateAbsence);
      // Reset form
      setSelectedEmployee(null);
      setStartDate("");
      setEndDate("")
      setAbsenceType(null);
      setRemainingDays(null)

      toast.success(data.message || t.absenceCreatedSuccessfully)
    } catch (error:unknown) {
      console.error( "Error creating absence:", error);
      flushError(error, t.errorCreatingAbsence)
    } finally {
      setIsSubmitting(false)
    }
  };

  // Calculate business days (excludes weekends and official holidays)
  const numberOfDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate + 'T00:00:00.000Z');
    const end = new Date(endDate + 'T00:00:00.000Z');
    if (start > end) return 0;
    return getBusinessDays(start, end, holidays);
  }, [startDate, endDate, holidays]);

  if(isLoading) return (
    <div className="h-full">
      <Spinner text={t.loading} />
    </div>
  )

  return (
    <section className="p-6 h-full overflow-y-visible lg:overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#244B77] to-[#1a3a5c] flex items-center justify-center shadow-md shadow-[#244B77]/20">
            <CalendarDays className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{t.leaveManagement}</h1>
            <p className="text-sm text-slate-600">{t.assignTimeOff}</p>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-slate-100 rounded-xl flex items-center gap-2 border border-slate-200" title={t.employees}>
            <Users size={16} className="text-slate-600" aria-hidden="true" />
            <span className="text-slate-800 font-bold">{employees?.length || 0}</span>
            <span className="text-slate-600 text-sm font-medium">{t.employees.toLowerCase()}</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 pb-4">
        
        {/* Left Column - Form Inputs (3/5) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Main Form Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            
            {/* Employee Selection */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} className="text-[#244B77]" aria-hidden="true" />
                <span className="text-slate-800 font-semibold">{t.employee}</span>
              </div>
              <Selector
                id="selector-employee"
                options={employees?.map((user) => user.username) || []}
                onChange={setSelectedEmployee}
                placeholder={t.selectEmployee + "..."}
                className="bg-slate-50 text-slate-800 border border-slate-200 rounded-xl hover:border-[#244B77]/30 transition-colors"
                value={selectedEmployee || ""}
                sorted={true}
              />
            </div>

            {/* Date Selection */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={16} className="text-[#244B77]" aria-hidden="true" />
                <span className="text-slate-800 font-semibold">{t.leavePeriod}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start-date" className="text-xs text-slate-600 font-medium mb-1.5 block">{t.startDate}</label>
                  <input
                    id="start-date"
                    type="date"
                    className="w-full bg-slate-50 text-slate-800 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#244B77]/30 focus:border-[#244B77]/50 transition-all"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="end-date" className="text-xs text-slate-600 font-medium mb-1.5 block">{t.endDate}</label>
                  <input
                    id="end-date"
                    type="date"
                    className="w-full bg-slate-50 text-slate-800 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#244B77]/30 focus:border-[#244B77]/50 transition-all"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Leave Type Selection */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-[#244B77]" aria-hidden="true" />
                <span className="text-slate-800 font-semibold">{t.leaveType}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {absenceTypes.map((type) => {
                  const style = leaveTypeStyles[type];
                  const isSelected = absenceType === type;
                  
                  return (
                    <button
                      key={type}
                      onClick={() => setAbsenceType(type)}
                      className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                        isSelected
                          ? `bg-gradient-to-br ${style.gradient} border-transparent text-white shadow-md ${style.glow}`
                          : `${style.softBg} border-transparent ${style.softText} hover:shadow-sm hover:scale-[1.02]`
                      }`}
                    >
                      <div className={`mb-2 ${isSelected ? "text-white" : ""}`}>
                        {style.icon}
                      </div>
                      <span className="text-xs font-semibold">{absenceTypeLabels[type]}</span>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white/80" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Summary & Action (2/5) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Balance Card */}
          <div className="bg-gradient-to-br from-[#244B77] to-[#1a3a5c] rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse" aria-hidden="true" />
              <span className="text-cyan-300 text-xs font-semibold uppercase tracking-wider">{t.leaveBalance}</span>
            </div>
            
            {remainingDays ? (
              <>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold text-white">{remainingDays.totalDaysLeft}</span>
                  <span className="text-white/80 font-medium">{t.daysAvailable}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/15 rounded-xl p-3 border border-white/20">
                    <span className="text-white/70 font-medium">{remainingDays.currentYear.year}</span>
                    <p className="text-cyan-300 font-bold text-lg">{remainingDays.currentYear.daysLeft}d</p>
                    <span className="text-white/60 text-[10px] font-medium">{t.remaining}</span>
                  </div>
                  <div className="bg-white/15 rounded-xl p-3 border border-white/20">
                    <span className="text-white/70 font-medium">{remainingDays.lastYear.year}</span>
                    <p className="text-amber-300 font-bold text-lg">{remainingDays.lastYear.daysLeft}d</p>
                    <span className="text-white/60 text-[10px] font-medium">{t.carriedOver}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-6 text-center">
                <Users size={32} className="mx-auto text-white/40 mb-3" aria-hidden="true" />
                <p className="text-white/70 text-sm font-medium">{t.selectEmployeeToViewBalance}</p>
              </div>
            )}
          </div>

          {/* Summary & Submit Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-[#244B77]" aria-hidden="true" />
              <span className="text-slate-800 font-semibold">{t.requestSummary}</span>
            </div>

            {/* Summary Details */}
            <div className="space-y-3 mb-5">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600 text-sm font-medium">{t.employee}</span>
                <span className="text-slate-800 font-semibold text-sm">{selectedEmployee || "—"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600 text-sm font-medium" title={t.businessDays}>{t.duration}</span>
                <span className="text-slate-800 font-semibold text-sm" title={t.businessDays}>
                  {numberOfDays > 0 ? `${numberOfDays} ${numberOfDays === 1 ? t.businessDay : t.businessDays.toLowerCase()}` : "—"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600 text-sm font-medium">{t.type}</span>
                <span className={`font-semibold text-sm ${absenceType ? leaveTypeStyles[absenceType]?.softText : "text-slate-800"}`}>
                  {absenceType ? absenceTypeLabels[absenceType] : "—"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-600 text-sm font-medium">{t.period}</span>
                <span className="text-slate-800 font-semibold text-sm">
                  {startDate && endDate ? `${startDate} → ${endDate}` : "—"}
                </span>
              </div>
            </div>
            
            <Button 
              onClick={handleCreateAbsence}
              disabled={!selectedEmployee || !startDate || !endDate || !absenceType}
              loading={isSubmitting}
              className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 disabled:opacity-40 disabled:shadow-none"
            >
              <Send size={18} className="mr-2" />
              {t.grantLeave}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}


