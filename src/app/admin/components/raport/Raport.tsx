import React, { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { User } from "@/types/user";
import Link from "next/link";
import Spinner from "@/components/ui/Spinner";
import { useSearchParams } from "next/navigation";
import { useCalendar } from "@/app/context/CalendarContext";
import { useWorkHours } from "@/app/context/WorkHoursContext";
import MonthYearPicker from "@/app/developer/components/monthYear/MonthYearPicker";

export default function Raport() {
  const searchParams = useSearchParams();
  const adminId = searchParams.get("adminId");
  const { reloadWorkHours, loading, getTotalHoursForUserInMonth } = useWorkHours();
  const { year, month, goToPreviousMonth, goToNextMonth, setMonthAndYear } = useCalendar();

  const [employee, setEmployee] = useState<{ users: User[] } | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  const formattedDate = useMemo(() => {
    return new Date(year, month).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
  }, [year, month]);

  // Fetch Users once
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/user", { cache: "no-store" });
        const data = await res.json();
        setEmployee(data);
      } catch (err) {
        console.error("Failed to fetch users:", err);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  // Reload work hours for all users when month, year or employee list changes
  useEffect(() => {
    async function loadAllWorkHours() {
      if (employee?.users?.length) {
        await Promise.all(
          employee.users.map((user) => reloadWorkHours(user.id as any, month + 1, year))
        );
      }
    }
    loadAllWorkHours();
  }, [month, year, employee, reloadWorkHours]);

  const handleClick = (m: number, y: number) => {
    setMonthAndYear(m, y);
  };

  if (isLoadingUsers || loading) return <Spinner />;

  return (
    <section className="overflow-auto max-h-[450px] 2xl:max-h-[700px] pb-10 rounded-md">
      {/* Month Navigation Bar */}
      <div className="flex items-center justify-center gap-5 mb-4 px-4">
        <Button variant="ghost" onClick={goToPreviousMonth}>
          <ChevronLeft />
        </Button>
        <h2 className="text-xl font-bold text-[#244B77]">{formattedDate}</h2>
        <MonthYearPicker />
        <Button variant="ghost" onClick={goToNextMonth}>
          <ChevronRight />
        </Button>
      </div>

      {/* Report Table */}
      <table
        className="w-fit text-[#244B77] border-separate"
        style={{ borderSpacing: "10px" }}
      >
        <thead className="bg-[#6C99CB] text-white">
          <tr className="text-left">
            <th className="px-4 py-2 w-16 rounded-sm">Nr</th>
            <th className="px-4 py-2 w-1/3 rounded-sm">Punonjësit</th>
            <th className="px-4 py-2 w-1/3 rounded-sm">Orët e punës ({formattedDate})</th>
            <th className="px-4 py-2 w-1/3 rounded-sm">Veprim</th>
          </tr>
        </thead>
        <tbody>
          {employee?.users?.map((emp, index: any) => {
            return (
              <tr
                key={emp.id}
                className="border-t border-[#d1d1d1] font-semibold text-lg bg-[#E3F0FF]"
              >
                <td className="px-4 py-2 bg-[#244B77] text-white font-semibold rounded-sm text-xl">
                  {index + 1}.
                </td>
                <td className="px-4 py-2 rounded-sm">{emp.username}</td>
                <td className="px-4 py-2 rounded-sm">{getTotalHoursForUserInMonth(emp.id.toString(), month + 1, year).toFixed(2)}</td>
                <td className="px-4 py-2 rounded-sm">
                  <Link href={`/developer/${emp.id}?adminId=${adminId}&month=${month + 1}&year=${year}`}>
                    <Button
                      variant="secondary"
                      className="font-semibold w-full justify-start pl-10"
                      onClick={() => handleClick(month, year)}
                    >
                      Shiko orët
                    </Button>
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

