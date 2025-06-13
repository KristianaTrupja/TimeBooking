
"use client";
import { createContext, useContext, useState } from "react";

interface CalendarContextProps {
  month: number;
  year: number;
  loading: boolean;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  showPendingModal: boolean;
setShowPendingModal: (v: boolean) => void;
}

const CalendarContext = createContext<CalendarContextProps | undefined>(undefined);

export const CalendarProvider = ({ children }: { children: React.ReactNode }) => {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [loading, setLoading] = useState(false);
  const simulateLoad = () => new Promise<void>((resolve) => setTimeout(resolve, 1000));
  const [showPendingModal, setShowPendingModal] = useState(false);


const hasWorkHoursInSession = () => {
  for (let i = 0; i < sessionStorage.length; i++) {
    if (sessionStorage.key(i)?.startsWith("workhours_")) {
      return true;
    }
  }
  return false;
};

const goToPreviousMonth = async () => {
  if (hasWorkHoursInSession()) {
     setShowPendingModal(true);
    return;
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
     setShowPendingModal(true);
    return;
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
      value={{ month, year,loading, goToPreviousMonth, goToNextMonth, showPendingModal, setShowPendingModal, }}
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