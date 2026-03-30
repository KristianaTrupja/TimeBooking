import VocationRow from "./VocationRow";
import VocationEditRow from "./VocationEditRow";
import { Holiday } from "@/types/holiday";

type Props = {
  vocations: Holiday[];
  editingId: number | null;
  editedData: { date: string; holiday: string };
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>, field: "date" | "holiday") => void;
  onSave: (id: number) => void;
};
export default function VocationTable({
  vocations,
  editingId,
  editedData,
  onEdit,
  onDelete,
  onChange,
  onSave,
}: Props) {
  return (
    <table className="w-full text-[#244B77] border-separate" style={{ borderSpacing: "10px" }}>
      <thead className="bg-[#6C99CB] text-white">
        <tr className="text-left">
          <th className="px-4 py-2 w-16 rounded-sm">Nr</th>
          <th className="px-4 py-2 w-1/3 rounded-sm">Data</th>
          <th className="px-4 py-2 rounded-sm">Festa</th>
          <th className="px-4 py-2 rounded-sm">Edito</th>
          <th className="px-4 py-2 rounded-sm">Fshij</th>
        </tr>
      </thead>
      <tbody>
        {vocations?.map((emp, index) =>
          editingId === emp.id ? (
            <VocationEditRow
              key={emp.id}
              index={index}
              editedData={editedData}
              onChange={onChange}
              onSave={() => onSave(emp.id)}
            />
          ) : (
            <VocationRow
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
  );
}
