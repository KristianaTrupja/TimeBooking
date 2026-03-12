"use client";
import { Holiday } from "@/types/holiday";
import { createContext, useContext, useEffect, useState } from "react";

const HolidayContext = createContext<Holiday[] | null | undefined>(undefined);

export const HolidayProvider = ({
  userId,
  children,
}: {
  userId?: number;
  children: React.ReactNode;
}) => {
  const [holidays, setHolidays] = useState<Holiday[] | null>(null);

  async function fetchHolidays(targetUserId?: number): Promise<Holiday[]> {
    const query = targetUserId ? `?userId=${targetUserId}` : "";
    const res = await fetch(`/api/vacations${query}`);
    if (!res.ok) {
        throw new Error(`Failed to fetch holidays: ${res.statusText}`);
    }
    return res.json();
}
  useEffect(() => {
    fetchHolidays(userId)
      .then(setHolidays)
      .catch((err) => console.error("Failed to fetch holidays:", err));
  }, [userId]);
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
