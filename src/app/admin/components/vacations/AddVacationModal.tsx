import { Modal } from "@/app/components/ui/Modal";
import { CalendarPlus, Calendar, Tag, Plus } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  data: { date: string; holiday: string };
  onChange: (e: React.ChangeEvent<HTMLInputElement>, field: "date" | "holiday") => void;
  onSubmit: () => void;
};

export default function AddVacationModal({ isOpen, onClose, data, onChange, onSubmit }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-slate-700 text-white">
          <CalendarPlus size={22} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Add New Holiday</h2>
          <p className="text-sm text-slate-500">Create an official holiday entry</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Date Input */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Date</label>
          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
              value={data.date}
              onChange={(e) => onChange(e, "date")}
            />
          </div>
        </div>

        {/* Holiday Name Input */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Holiday Name</label>
          <div className="relative">
            <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="e.g., Christmas Day"
              type="text"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors placeholder:text-slate-400"
              value={data.holiday}
              onChange={(e) => onChange(e, "holiday")}
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={onSubmit}
          className="w-full mt-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-sm hover:from-blue-500 hover:to-indigo-500 transition-all shadow-md flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Add Holiday
        </button>
      </div>
    </Modal>
  );
}
