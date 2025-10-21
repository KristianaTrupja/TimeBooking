import VacationRow from "./VacationRow";
import VacationEditRow from "./VacationEditRow";
import { Holiday } from "@/types/holiday";

type Props = {
  vacations: Holiday[];
  editingId: number | null;
  editedData: { date: string; holiday: string };
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>, field: "date" | "holiday") => void;
  onSave: (id: number) => void;
};
export default function VacationTable({
  vacations,
  editingId,
  editedData,
  onEdit,
  onDelete,
  onChange,
  onSave,
}: Props) {
  // Group vacations by year
  const groupedByYear = vacations
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .reduce<Record<string, Holiday[]>>((acc, curr) => {
      const year = new Date(curr.date).getFullYear();
      if (!acc[year]) acc[year] = [];
      acc[year].push(curr);
      return acc;
    }, {});
  return (
    <>
      {vacations?.length === 0 ? (
        <table className="w-full">
          <thead>
            <tr>
              <th colSpan={5} className="text-[#244B77] text-center py-4 text-xl">
                Nuk ka pushime shto pushimet.
              </th>
            </tr>
          </thead>
        </table>
      ) : (
        <>
          {Object.entries(groupedByYear).map(([year, yearVacations]) => (
            <table
              key={year}
              className="w-full text-[#244B77] border-separate mb-10"
              style={{ borderSpacing: "10px" }}
            >
              <thead className="bg-[#6C99CB] text-white">
                <tr>
                  <th colSpan={5} className="bg-[#244B77] text-center font-bold text-lg py-2 text-white">
                    Viti {year}
                  </th>
                </tr>
                <tr className="text-left">
                  <th className="px-4 py-2 w-16 rounded-sm">Nr</th>
                  <th className="px-4 py-2 w-1/3 rounded-sm">Data</th>
                  <th className="px-4 py-2 rounded-sm">Festa</th>
                  <th className="px-4 py-2 rounded-sm">Edito</th>
                  <th className="px-4 py-2 rounded-sm">Fshij</th>
                </tr>
              </thead>
              <tbody>
                {yearVacations.map((emp, index) =>
                  editingId === emp.id ? (
                    <VacationEditRow
                      key={emp.id}
                      index={index}
                      editedData={editedData}
                      onChange={onChange}
                      onSave={() => onSave(emp.id)}
                    />
                  ) : (
                    <VacationRow
                      key={emp.id}
                      index={index}
                      emp={emp}
                      onEdit={() => onEdit(emp.id)}
                      onDelete={() => onDelete(emp.id)}
                    />
                  )
                )}
              </tbody>
            </table>
          ))}
        </>
      )}
    </>
  );
}
