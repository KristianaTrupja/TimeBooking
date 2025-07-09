
"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface CalendarContextProps {
  month: number;
  year: number;
  loading: boolean;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  showPendingDataModal: boolean;
  setShowPendingDataModal: (v: boolean) => void;
  isPending: boolean;
  refreshPendingStatus: () => void;
  isSaved: boolean
  setIsSaved: (v: boolean) => void;
  setMonthAndYear: (month: number, year: number, animation?: boolean) => void;
}

const CalendarContext = createContext<CalendarContextProps | undefined>(undefined);

export const CalendarProvider = ({ children }: { children: React.ReactNode }) => {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [loading, setLoading] = useState(false);
  const simulateLoad = () => new Promise<void>((resolve) => setTimeout(resolve, 1000));
  const [showPendingDataModal, setShowPendingDataModal] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateUrlParams = (newMonth: number, newYear: number) => {
    if (typeof window === "undefined" || searchParams.get("month") == null) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("month", (newMonth + 1).toString()); // month is 0-indexed
    params.set("year", newYear.toString());

    router.replace(`${pathname}?${params.toString()}`);
  };

  const hasWorkHoursInSession = () => {
    for (let i = 0; i < sessionStorage.length; i++) {
      if (sessionStorage.key(i)?.startsWith("workhours_")) {
        return true;
      }
    }
    return false;
  };

  const refreshPendingStatus = () => {
    const pending = hasWorkHoursInSession();
    setIsPending(pending);
  };

  useEffect(() => {
    refreshPendingStatus();
    const interval = setInterval(refreshPendingStatus, 500);
    return () => clearInterval(interval);
  }, []);

  const setMonthAndYear = async (newMonth: number, newYear: number, animation = false) => {
    animation && setLoading(true);
    await simulateLoad();
    setMonth(newMonth);
    setYear(newYear);
    updateUrlParams(newMonth, newYear);
    animation && setLoading(false);
  };

  const goToPreviousMonth = async () => {
    if (hasWorkHoursInSession()) {
      setShowPendingDataModal(true);
      return;
    }

    if (isSaved) {
      setIsSaved(false)
    }

    setLoading(true);
    await simulateLoad();

    let newMonth = month;
    let newYear = year;

    if (month === 0) {
      newMonth = 11;
      newYear = year - 1;
    } else {
      newMonth = month - 1;
    }

    setMonth(newMonth);
    setYear(newYear);
    updateUrlParams(newMonth, newYear);

    setLoading(false);
  };

  const goToNextMonth = async () => {
    if (hasWorkHoursInSession()) {
      setShowPendingDataModal(true);
      return;
    }

    if (isSaved) {
      setIsSaved(false)
    }

    setLoading(true);
    await simulateLoad();

    let newMonth = month;
    let newYear = year;

    if (month === 11) {
      newMonth = 0;
      newYear = year + 1;
    } else {
      newMonth = month + 1;
    }

    setMonth(newMonth);
    setYear(newYear);
    updateUrlParams(newMonth, newYear); // ✅

    setLoading(false);
  };

  return (
    <CalendarContext.Provider
      value={{ month, year, loading, goToPreviousMonth, goToNextMonth, showPendingDataModal, setShowPendingDataModal, isPending, refreshPendingStatus, isSaved, setIsSaved, setMonthAndYear, }}
    >
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) throw new Error("useCalendar must be used within CalendarProvider");
  return context;
};