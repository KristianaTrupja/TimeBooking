"use client";
import { Holiday } from "@/types/holiday";
import { createContext, useContext, useEffect, useState } from "react";

const HolidayContext = createContext<Holiday[] | null | undefined>(undefined);

export const HolidayProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [holidays, setHolidays] = useState<Holiday[] | null>(null);

  async function fetchHolidays(): Promise<Holiday[]> {
    const res = await fetch("/api/vacations");
    if (!res.ok) {
        throw new Error(`Failed to fetch holidays: ${res.statusText}`);
    }
    return res.json();
}
  useEffect(() => {
    fetchHolidays()
      .then(setHolidays)
      .catch((err) => console.error("Failed to fetch holidays:", err));
  }, []);
  return (
    <HolidayContext.Provider value={holidays}>
      {children}
    </HolidayContext.Provider>
  );
};

export const useHolidayContext = () => {
  const holidays = useContext(HolidayContext);

  if (holidays === undefined) {
    throw new Error("useHolidayContext must be used within a HolidayProvider");
  }

  const loading = holidays === null;
  return [holidays ?? [], loading] as const;
};