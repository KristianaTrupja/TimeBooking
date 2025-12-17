import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/app/components/ui/Modal";
import { Clock, FileText, Save } from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (hours: number, note: string) => Promise<void>;
  initialHours: string;
  initialNote: string;
};


export const WorkHoursModal = ({
  isOpen,
  onClose,
  onSave,
  initialHours,
  initialNote,
}: Props) => {
  const [inputValue, setInputValue] = useState(initialHours);
  const [textareaValue, setTextAreaValue] = useState(initialNote);
  const [inputError, setInputError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { t } = useLanguage();

  const handleSave = useCallback(async () => {
    const hours = parseFloat(inputValue.trim());
    if (isNaN(hours) || hours < 0 || hours % 0.25 !== 0) {
      setInputError("Only non-negative fractions of 0.25 are allowed");
      return;
    }
    setIsSaving(true);
    try {
      await onSave(hours, hours === 0 ? "" : textareaValue);
      onClose();
    } finally {
      setIsSaving(false);
    }
  }, [inputValue, textareaValue, onSave, onClose]);


  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#244B77] to-[#1a3a5c] flex items-center justify-center shadow-md">
            <Clock className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">{t.logWorkHours}</h2>
            <p className="text-sm text-slate-400 font-normal">{t.recordTime}</p>
          </div>
        </div>
      }
      footer={
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={!!inputError}
            loading={isSaving}
            className="bg-gradient-to-r from-[#244B77] to-[#1a3a5c] hover:from-[#2d5a8a] hover:to-[#244B77] text-white font-medium px-6 py-2.5 rounded-xl shadow-md shadow-[#244B77]/20 disabled:opacity-40 disabled:shadow-none transition-all"
          >
            <Save size={16} className="mr-2" />
            {isSaving ? t.saving : t.saveHours}
          </Button>
        </div>
      }
      className="max-w-md"
    >
      <div className="flex flex-col gap-5">
        {/* Hours Input */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} className="text-[#244B77]" />
            <label className="text-sm font-medium text-slate-700">{t.hoursWorked}</label>
          </div>
          <input
            autoFocus
            type="number"
            step={0.25}
            value={inputValue}
            onFocus={(e) => {
              e.target.select();
            }}
            onChange={(e) => {
              setInputValue(e.target.value);
              const val = parseFloat(e.target.value);
              if (isNaN(val) || val < 0 || val % 0.25 !== 0) {
                setInputError(t.hoursValidation);
              } else {
                setInputError(null);
              }
            }}
            className={`w-full px-4 py-3 rounded-xl text-lg font-semibold text-center transition-all ${
              inputError 
                ? "border-2 border-red-400 bg-red-50 text-red-600 focus:ring-red-400/30" 
                : "border border-slate-200 bg-slate-50 text-slate-700 focus:ring-[#244B77]/30 focus:border-[#244B77]/50"
            } focus:outline-none focus:ring-2`}
            placeholder="0.00"
          />
          {inputError && (
            <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-red-500"></span>
              {inputError}
            </p>
          )}
          <p className="text-xs text-slate-400 mt-2 text-center">{t.hoursHint}</p>
        </div>

        {/* Note Input */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileText size={14} className="text-[#244B77]" />
            <label className="text-sm font-medium text-slate-700">{t.description}</label>
            <span className="text-xs text-slate-400">({t.optional})</span>
          </div>
          <textarea
            value={textareaValue}
            onChange={(e) => setTextAreaValue(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#244B77]/30 focus:border-[#244B77]/50 transition-all resize-none"
            placeholder={t.whatDidYouWorkOn}
            rows={3}
          />
        </div>
      </div>
    </Modal>
  );
};
