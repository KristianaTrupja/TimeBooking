import React, { useEffect, useState } from "react";
import {FilePenLine, Delete } from "lucide-react";
import { User } from "@/types/user";
import Spinner from "@/components/ui/Spinner";
import { Absence } from "@/types/absence";

export default function ModifyAbsences() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [absRes, userRes] = await Promise.all([
          fetch("/api/absences", { cache: "no-store" }),
          fetch("/api/user", { cache: "no-store" }),
        ]);

        const absData = await absRes.json();
        const userData = await userRes.json();

        setAbsences(absData.absences || []);
        setEmployees(userData.users || []);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setTimeout(() => setIsLoading(false), 500);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("sq-AL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  if (isLoading) return <Spinner />;

  const getUsername = (userId: string | number) =>
    employees.find((user) => user.id === Number(userId))?.username || "—";

  return (
    <section className="overflow-auto max-h-[450px] 2xl:max-h-[700px] pb-10 rounded-md">
      <table
        className="w-fit text-[#244B77] border-separate"
        style={{ borderSpacing: "10px" }}
      >
        <thead className="bg-[#6C99CB] text-white">
          <tr className="text-left">
            <th className="px-4 py-2 w-16 rounded-sm">Nr</th>
            <th className="px-4 py-2 w-1/4 rounded-sm">Punonjesit</th>
            <th className="px-4 py-2 w-1/4 rounded-sm">Data e fillimit</th>
            <th className="px-4 py-2 w-1/4 rounded-sm">Data e mbarimit</th>
            <th className="px-4 py-2 w-1/4 rounded-sm">Tipi</th>
            <th className="px-4 py-2 w-1/4 rounded-sm">Edito</th>
            <th className="px-4 py-2 w-1/4 rounded-sm">Fshij</th>
          </tr>
        </thead>
        <tbody>
          {absences.map((absence, index) => (
            <tr
              key={absence.id}
              className="border-t border-[#d1d1d1] font-semibold text-lg bg-[#E3F0FF]"
            >
              <td className="px-4 py-2 bg-[#244B77] text-white font-semibold rounded-sm text-xl">
                {index + 1}.
              </td>
              <td className="px-4 py-2 rounded-sm">
                {getUsername(absence.userId)}
              </td>
              <td className="px-4 py-2 rounded-sm">
                {formatDate(absence.startDate)}
              </td>
              <td className="px-4 py-2 rounded-sm">
                {formatDate(absence.endDate)}
              </td>
              <td className="px-4 py-2 rounded-sm">{absence.type}</td>
              <td className="px-4 py-2 rounded-sm text-green-800">
                <button>
                  <FilePenLine />
                </button>
              </td>
              <td className="px-4 py-2 rounded-sm text-red-800">
                <button>
                  <Delete />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
