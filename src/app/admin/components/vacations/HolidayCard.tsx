import { Trash2, Pencil, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/app/context/LanguageContext";

type Props = {
  holiday: { id: number; date: string; title: string };
  index: number;
  isEditing: boolean;
  editedData: { date: string; holiday: string };
  onChange: (e: React.ChangeEvent<HTMLInputElement>, field: "date" | "holiday") => void;
  onEdit: () => void;
  onDelete: () => void;
  onSave: () => void;
  isSaving?: boolean;
  isDeleting?: boolean;
};

export default function HolidayCard({ 
  holiday, 
  index, 
  isEditing, 
  editedData, 
  onChange, 
  onEdit, 
  onDelete, 
  onSave, 
  isSaving, 
  isDeleting 
}: Props) {
  const { language, t } = useLanguage();
  
  function formatToDayMonth(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'de' ? "de-DE" : "en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  return (
    <div className={`p-4 border border-slate-200 rounded-lg transition-all ${isEditing ? "bg-blue-50 border-blue-300 ring-2 ring-blue-200" : "bg-white"}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-200 to-blue-300 flex items-center justify-center">
            <Calendar size={18} className="text-blue-700" />
          </div>
          {isEditing ? (
            <input
              type="text"
              value={editedData.holiday}
              onChange={(e) => onChange(e, "holiday")}
              className="px-3 py-1.5 text-sm border border-blue-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
            />
          ) : (
            <span className="font-bold text-base text-slate-900">{holiday.title}</span>
          )}
        </div>
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
          {index + 1}
        </span>
      </div>

      {/* Date */}
      <div className="mb-4">
        <span className="text-xs font-semibold uppercase text-slate-500 block mb-2">{t.date}</span>
        {isEditing ? (
          <input
            type="date"
            value={editedData.date}
            onChange={(e) => onChange(e, "date")}
            className="w-[calc(100%-32px)] sm:w-full px-3 py-1.5 text-sm border border-blue-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-slate-800 font-medium">{formatToDayMonth(holiday.date)}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {isEditing ? (
          <Button 
            size="sm" 
            onClick={onSave}
            disabled={isSaving}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white"
          >
            {isSaving ? t.saving : t.save}
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              <Pencil size={14} className="mr-1" />
              {t.edit}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              disabled={isDeleting}
              className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
            >
              <Trash2 size={14} className="mr-1" />
              {t.delete}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
