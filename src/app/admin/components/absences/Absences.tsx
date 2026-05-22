"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import Selector from "@/app/components/Selector";
import { Modal } from "@/app/components/ui/Modal";
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
  Palmtree, 
  Stethoscope, 
  House,
  Calendar,
  Sparkles,
  TrendingUp,
  Clock,
  Coins,
  ReceiptText
} from "lucide-react";

type APIRemainingDays = {
    currentYear: {
      year:number,
      daysLeft:number,
      daysSpent:number,
      overtimeCompDays?: number,
      cashedOutDays?: number,
    },
    lastYear: {
      year:number,
      daysLeft:number,
      daysSpent:number,
      overtimeCompDays?: number,
      cashedOutDays?: number,
    }
    totalDaysLeft: number
}

type LeaveAdjustmentItem = {
  id: number;
  userId: number;
  year: number;
  type: "OVERTIME_COMPENSATION" | "UNUSED_LEAVE_CASHOUT";
  days: number;
  note: string | null;
  createdAt: string;
};

function isRemainingDaysPayload(value: unknown): value is APIRemainingDays {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, any>;
  return (
    !!data.currentYear &&
    typeof data.currentYear.year === "number" &&
    !!data.lastYear &&
    typeof data.lastYear.year === "number" &&
    typeof data.totalDaysLeft === "number"
  );
}

const absenceTypes: (keyof typeof AbsenceType)[] = [
  "VACATION",
  "OFFICIAL_HOLIDAYS",
  "SICK",
  "HOME_OFFICE",
  "OTHER",
]

const leaveTypeStyles: Record<string, { icon: React.ReactNode; gradient: string; glow: string; softBg: string; softText: string }> = {
  VACATION: { icon: <Palmtree size={20} />, gradient: "from-teal-400 to-emerald-400", glow: "shadow-teal-400/20", softBg: "bg-teal-50", softText: "text-teal-600" },
  OFFICIAL_HOLIDAYS: { icon: <Calendar size={20} />, gradient: "from-cyan-400 to-sky-500", glow: "shadow-cyan-400/20", softBg: "bg-cyan-50", softText: "text-cyan-600" },
  SICK: { icon: <Stethoscope size={20} />, gradient: "from-rose-400 to-pink-400", glow: "shadow-rose-400/20", softBg: "bg-rose-50", softText: "text-rose-500" },
  HOME_OFFICE: { icon: <House size={20} />, gradient: "from-violet-400 to-purple-500", glow: "shadow-violet-400/20", softBg: "bg-violet-50", softText: "text-violet-600" },
  OTHER: { icon: <Sparkles size={20} />, gradient: "from-indigo-400 to-violet-500", glow: "shadow-indigo-400/20", softBg: "bg-indigo-50", softText: "text-indigo-600" },
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
  const [adjustments, setAdjustments] = useState<LeaveAdjustmentItem[]>([])
  const [isAdjustmentsLoading, setIsAdjustmentsLoading] = useState(false)
  const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState(false)
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false)
  const [adjustmentYear, setAdjustmentYear] = useState<number>(new Date().getFullYear())
  const [adjustmentType, setAdjustmentType] = useState<"OVERTIME_COMPENSATION" | "UNUSED_LEAVE_CASHOUT">("OVERTIME_COMPENSATION")
  const [adjustmentDays, setAdjustmentDays] = useState<string>("")
  const [adjustmentNote, setAdjustmentNote] = useState<string>("")
  
  // Translation map for absence types - memoized to update when language changes
  const absenceTypeLabels = useMemo<Record<string, string>>(() => ({
    VACATION: t.vacation,
    OFFICIAL_HOLIDAYS: t.officialHolidays,
    SICK: t.sick,
    HOME_OFFICE: t.homeOffice,
    OTHER: t.other,
  }), [t]);

  const selectedEmployeeData = useMemo(
    () => employees?.find((employee) => employee.username === selectedEmployee) ?? null,
    [employees, selectedEmployee]
  );

  const fetchLeaveBalanceAndHolidays = async (userId: number) => {
    const [remainingRes, holidayRes] = await Promise.all([
      fetch(`/api/absences/${userId}`, { cache: "no-store" }),
      fetch(`/api/holidays?userId=${userId}`, { cache: "no-store" }),
    ]);

    if (remainingRes.ok) {
      const remainingData = await remainingRes.json();
      setRemainingDays(isRemainingDaysPayload(remainingData) ? remainingData : null);
    } else {
      setRemainingDays(null);
    }

    if (holidayRes.ok) {
      const holidayData = await holidayRes.json();
      const holidayDates =
        holidayData.holidays?.map((holiday: { date: string }) =>
          new Date(holiday.date).toISOString().split("T")[0]
        ) || [];
      setHolidays(holidayDates);
    } else {
      setHolidays([]);
    }
  };

  const fetchAdjustments = async (userId: number, year: number) => {
    setIsAdjustmentsLoading(true);
    try {
      const res = await fetch(
        `/api/leave-adjustments?userId=${userId}&year=${year}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || t.somethingWentWrong);
      }
      setAdjustments(data.adjustments || []);
    } catch (error) {
      console.error("Failed to fetch leave adjustments:", error);
      setAdjustments([]);
    } finally {
      setIsAdjustmentsLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedEmployeeData) {
      setRemainingDays(null);
      setHolidays([]);
      setAdjustments([]);
      return;
    }

    fetchLeaveBalanceAndHolidays(selectedEmployeeData.id).catch(() => {
      setRemainingDays(null);
      setHolidays([]);
    });
  }, [selectedEmployeeData]);

  useEffect(() => {
    if (!selectedEmployeeData) {
      setAdjustments([]);
      return;
    }
    fetchAdjustments(selectedEmployeeData.id, adjustmentYear);
  }, [selectedEmployeeData, adjustmentYear]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await fetch("/api/user", { cache: "no-store" });

        if(!userRes.ok) {
          const error = await userRes.json()
          throw new Error(error ? error : t.somethingWentWrong)
        }

        const userData = await userRes.json();
        setEmployees(userData.users);
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

  async function handleCreateAdjustment() {
    if (!selectedEmployeeData) {
      flushError(new Error(t.selectEmployee));
      return;
    }
    if (!adjustmentDays) {
      flushError(new Error(t.pleaseFillRequiredFields));
      return;
    }

    setIsSubmittingAdjustment(true);
    try {
      const response = await fetch("/api/leave-adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedEmployeeData.id,
          year: adjustmentYear,
          type: adjustmentType,
          days: Number(adjustmentDays),
          note: adjustmentNote,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || t.somethingWentWrong);
      }

      toast.success(data.message || t.adjustmentRecordedSuccessfully);
      setAdjustmentDays("");
      setAdjustmentNote("");
      await Promise.all([
        fetchLeaveBalanceAndHolidays(selectedEmployeeData.id),
        fetchAdjustments(selectedEmployeeData.id, adjustmentYear),
      ]);
    } catch (error: unknown) {
      console.error("Error recording leave adjustment:", error);
      flushError(error, t.somethingWentWrong);
    } finally {
      setIsSubmittingAdjustment(false);
    }
  }

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
    <section className="p-3 py-6 sm:p-6 h-full overflow-y-visible lg:overflow-y-auto custom-scrollbar">
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
          <Button
            onClick={() => setIsAdjustmentModalOpen(true)}
            disabled={!selectedEmployeeData}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 disabled:opacity-40 disabled:shadow-none gap-2"
          >
            <ReceiptText size={16} />
            {t.leaveAdjustments}
          </Button>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 pb-4 min-w-0">
        
        {/* Left Column - Form Inputs (3/5) */}
        <div className="lg:col-span-3 space-y-5 min-w-0">
          {/* Main Form Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm min-w-0">
            
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                <div className="min-w-0">
                  <label htmlFor="start-date" className="text-xs text-slate-600 font-medium mb-1.5 block">{t.startDate}</label>
                  <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-[#244B77]/30 focus-within:border-[#244B77]/50 transition-all">
                    <input
                      id="start-date"
                      type="date"
                      className="block w-full max-w-full min-w-0 bg-slate-50 text-slate-800 px-4 py-3"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="min-w-0 ">
                  <label htmlFor="end-date" className="text-xs text-slate-600 font-medium mb-1.5 block">{t.endDate}</label>
                  <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-[#244B77]/30 focus-within:border-[#244B77]/50 transition-all">
                    <input
                      id="end-date"
                      type="date"
                      className="block w-full max-w-full min-w-0 bg-slate-50 text-slate-800 px-4 py-3"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Leave Type Selection */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-[#244B77]" aria-hidden="true" />
                <span className="text-slate-800 font-semibold">{t.leaveType}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                      <span className="text-sm font-semibold">{absenceTypeLabels[type]}</span>
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
                <div className="mt-3 text-[11px] text-white/80 space-y-1">
                  <p>
                    + {t.overtimeCompensation}:{" "}
                    {(remainingDays.currentYear.overtimeCompDays || 0) +
                      (remainingDays.lastYear.overtimeCompDays || 0)}
                  </p>
                  <p>
                    - {t.unusedLeaveCashout}:{" "}
                    {(remainingDays.currentYear.cashedOutDays || 0) +
                      (remainingDays.lastYear.cashedOutDays || 0)}
                  </p>
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
      <Modal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        title={
          <div className="flex items-center justify-center gap-2">
            <ReceiptText size={20} />
            <span>{t.leaveAdjustments}</span>
          </div>
        }
        className="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">{t.employee}:</span>{" "}
              {selectedEmployeeData?.username || "—"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-600 font-medium mb-1 block">{t.year}</label>
                <input
                  type="number"
                  value={adjustmentYear}
                  onChange={(e) => setAdjustmentYear(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244B77]/20"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 font-medium mb-1 block">{t.type}</label>
                <select
                  value={adjustmentType}
                  onChange={(e) =>
                    setAdjustmentType(
                      e.target.value as "OVERTIME_COMPENSATION" | "UNUSED_LEAVE_CASHOUT"
                    )
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244B77]/20"
                >
                  <option value="OVERTIME_COMPENSATION">{t.overtimeCompensation}</option>
                  <option value="UNUSED_LEAVE_CASHOUT">{t.unusedLeaveCashout}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-600 font-medium mb-1 block">{t.days}</label>
              <input
                type="number"
                min={1}
                value={adjustmentDays}
                onChange={(e) => setAdjustmentDays(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244B77]/20"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-medium mb-1 block">{t.note}</label>
              <input
                type="text"
                value={adjustmentNote}
                onChange={(e) => setAdjustmentNote(e.target.value)}
                placeholder={t.note}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244B77]/20"
              />
            </div>

            <Button
              onClick={handleCreateAdjustment}
              loading={isSubmittingAdjustment}
              disabled={!selectedEmployeeData}
              className="w-full bg-gradient-to-r from-[#244B77] to-[#1a3a5c] hover:from-[#2d5a8a] hover:to-[#244B77] text-white gap-2"
            >
              <Coins size={16} />
              {t.recordAdjustment}
            </Button>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-600 mb-2">{t.adjustmentHistory}</p>
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
              {isAdjustmentsLoading ? (
                <p className="text-sm text-slate-500">{t.loading}</p>
              ) : adjustments.length === 0 ? (
                <p className="text-sm text-slate-500">{t.noAdjustmentsYet}</p>
              ) : (
                adjustments.map((item) => (
                  <div key={item.id} className="rounded-lg border border-slate-200 px-3 py-2 text-xs bg-white">
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-semibold text-slate-800">
                        {item.type === "OVERTIME_COMPENSATION"
                          ? t.overtimeCompensation
                          : t.unusedLeaveCashout}
                      </span>
                      <span className="text-slate-500">{item.year}</span>
                    </div>
                    <p className="text-slate-600">
                      {item.days} {t.days.toLowerCase()}
                    </p>
                    {item.note ? <p className="text-slate-500 truncate">{item.note}</p> : null}
                    <p className="text-[11px] text-slate-400 mt-1">
                      {new Date(item.createdAt).toLocaleString("en-GB")}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Modal>
    </section>
  );
}


