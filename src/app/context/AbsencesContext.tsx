"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Absence } from "@/types/absence";

type AbsenceContextType = [Absence[], boolean];

const AbsenceContext = createContext<AbsenceContextType | undefined>(undefined);

export function AbsenceProvider({ children }: { children: ReactNode }) {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const userId = pathname.split("/")[2];
  useEffect(() => {
    async function fetchAbsences() {
      try {
        const res = await fetch(`/api/absences?userId=${userId}`);
        const data = await res.json();
        setAbsences(data.absences || []);
      } catch (err) {
        console.error("Failed to fetch absences", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAbsences();
  }, []);

  return (
    <AbsenceContext.Provider value={[absences, loading]}>
      {children}
    </AbsenceContext.Provider>
  );
}

export function useAbsenceContext() {
  const context = useContext(AbsenceContext);
  if (!context) throw new Error("useAbsenceContext must be used inside AbsenceProvider");
  return context;
}
