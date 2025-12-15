import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import Selector from "@/app/components/Selector";
import { User } from "@/types/user";
import Spinner from "@/components/ui/Spinner";
import { AbsenceType } from "@/types/absence";
import { flushError } from "@/app/utils/flushError";
import { toast } from "sonner";
import { 
  CalendarDays, 
  Send, 
  Users, 
  Palmtree, 
  Stethoscope, 
  Heart, 
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
  PERSONAL: { icon: <Heart size={20} />, gradient: "from-violet-400 to-purple-400", glow: "shadow-violet-400/20", softBg: "bg-violet-50", softText: "text-violet-500" },
  PARENTAL: { icon: <Baby size={20} />, gradient: "from-amber-400 to-orange-400", glow: "shadow-amber-400/20", softBg: "bg-amber-50", softText: "text-amber-500" },
}

export default function Absences() {
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [absenceType, setAbsenceType] = useState<string | null>(null)
  const [employees, setEmployees] = useState<User[]| null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [remainingDays, setRemainingDays] = useState<APIRemainingDays | null>(null)

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
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user", { cache: "no-store" })
        if(!res.ok) {
          const error = await res.json()
          throw new Error(error ? error : "Failed to fetch users")
        }
        const data = await res.json();
        setEmployees(data.users);
      } catch (err) {
        console.error("Failed to fetch users:", err)
        flushError(err, "Failed to fetch users")
      }
      finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [])

  async function handleCreateAbsence() {
    if (!selectedEmployee || !startDate || !endDate || !absenceType) {
      flushError(new Error("Please fill in all fields"))
      return
    }

    const user = employees?.find((u) => u.username === selectedEmployee)
    if (!user) {
      flushError(new Error("Selected employee not found"))
      return;
    }

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
      if (!response.ok) throw new Error(data.message || "Failed to create absence");
      // Reset form
      setSelectedEmployee(null);
      setStartDate("");
      setEndDate("")
      setAbsenceType(null);
      setRemainingDays(null)

      toast.success(data.message || "Absence created successfully!")
    } catch (error:unknown) {
      console.error( "Error creating absence:", error);
      flushError(error, "Error creating absence")
    }
  };

  // Calculate days
  const numberOfDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  }, [startDate, endDate]);

  if(isLoading) return (
    <div className="flex items-center justify-center h-full">
      <Spinner />
    </div>
  )

  return (
    <section className="p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-md shadow-amber-400/20">
            <CalendarDays className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-700">Leave Management</h1>
            <p className="text-sm text-slate-400">Assign time-off to team members</p>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-slate-100 rounded-xl flex items-center gap-2 border border-slate-200">
            <Users size={16} className="text-slate-500" />
            <span className="text-slate-700 font-semibold">{employees?.length || 0}</span>
            <span className="text-slate-400 text-sm">employees</span>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-3 gap-5">
        
        {/* Left Panel - Employee & Balance */}
        <div className="space-y-4">
          {/* Employee Selection Card */}
          <div className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-teal-300 animate-pulse" />
              <span className="text-teal-300 text-xs font-medium uppercase tracking-wider">Select Employee</span>
            </div>
            <Selector
              id="selector-employee"
              options={employees?.map((user) => user.username) || []}
              onChange={setSelectedEmployee}
              placeholder="Choose..."
              className="bg-slate-500/30 text-white border border-slate-500 rounded-lg hover:border-teal-400/50 transition-colors"
              value={selectedEmployee || ""}
              sorted={true}
            />
            
            {/* Balance Display */}
            {remainingDays && (
              <div className="mt-4 p-4 bg-white/10 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300 text-xs">Available Balance</span>
                  <Sparkles size={14} className="text-teal-300" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">{remainingDays.totalDaysLeft}</span>
                  <span className="text-slate-400">days</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-600/50 rounded-lg p-2">
                    <span className="text-slate-400">{remainingDays.currentYear.year}</span>
                    <p className="text-teal-300 font-semibold">{remainingDays.currentYear.daysLeft}d left</p>
                  </div>
                  <div className="bg-slate-600/50 rounded-lg p-2">
                    <span className="text-slate-400">{remainingDays.lastYear.year}</span>
                    <p className="text-amber-300 font-semibold">{remainingDays.lastYear.daysLeft}d carried</p>
                  </div>
                </div>
              </div>
            )}
            
            {!selectedEmployee && (
              <div className="mt-4 p-4 border border-dashed border-slate-500 rounded-xl text-center">
                <Users size={24} className="mx-auto text-slate-500 mb-2" />
                <p className="text-slate-400 text-sm">Select an employee to view balance</p>
              </div>
            )}
          </div>
        </div>

        {/* Center Panel - Date Selection */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={16} className="text-slate-400" />
              <span className="text-slate-600 font-medium">Leave Period</span>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Start Date</label>
                <input
                  type="date"
                  className="w-full bg-slate-50 text-slate-600 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400 transition-all"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">End Date</label>
                <input
                  type="date"
                  className="w-full bg-slate-50 text-slate-600 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400 transition-all"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Duration Display */}
            {numberOfDays > 0 && (
              <div className="mt-4 p-4 bg-gradient-to-r from-slate-500 to-slate-600 rounded-xl text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-teal-300" />
                    <span className="text-sm text-slate-300">Duration</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold">{numberOfDays}</span>
                    <span className="text-sm text-slate-300 ml-1">{numberOfDays === 1 ? "day" : "days"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Leave Type & Submit */}
        <div className="space-y-4">
          {/* Leave Type Selection */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-slate-400" />
              <span className="text-slate-600 font-medium">Leave Type</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
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
                        : `${style.softBg} border-transparent ${style.softText} hover:shadow-sm`
                    }`}
                  >
                    <div className={`mb-2 ${isSelected ? "text-white" : ""}`}>
                      {style.icon}
                    </div>
                    <span className="text-sm font-medium">{type}</span>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white/80" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Card */}
          <div className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl p-5 shadow-lg">
            <div className="mb-4">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Ready to submit?</p>
              <p className="text-white/90 text-sm">
                {selectedEmployee && absenceType && numberOfDays > 0 
                  ? `Grant ${numberOfDays} ${numberOfDays === 1 ? "day" : "days"} of ${absenceType.toLowerCase()} leave`
                  : "Complete all fields above"
                }
              </p>
            </div>
            
            <Button 
              onClick={handleCreateAbsence}
              disabled={!selectedEmployee || !startDate || !endDate || !absenceType}
              className="w-full py-6 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-white font-semibold rounded-xl shadow-md shadow-teal-400/20 disabled:opacity-40 disabled:shadow-none transition-all duration-300"
            >
              <Send size={18} className="mr-2" />
              Grant Leave
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
