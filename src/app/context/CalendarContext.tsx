
"use client";
import { createContext, useContext, useEffect, useState } from "react";

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
    const interval = setInterval(refreshPendingStatus, 500); // Polling approach
    return () => clearInterval(interval);
  }, []);

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
    if (month === 0) {
      setMonth(11);
      setYear((prev) => prev - 1);
    } else {
      setMonth((prev) => prev - 1);
    }
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
    if (month === 11) {
      setMonth(0);
      setYear((prev) => prev + 1);
    } else {
      setMonth((prev) => prev + 1);
    }
    setLoading(false);
  };

  return (
    <CalendarContext.Provider
      value={{ month, year, loading, goToPreviousMonth, goToNextMonth, showPendingDataModal, setShowPendingDataModal, isPending, refreshPendingStatus, isSaved, setIsSaved }}
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