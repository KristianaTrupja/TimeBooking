import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/app/components/ui/Modal";

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

  const handleSave = useCallback(async () => {
    const hours = parseFloat(inputValue.trim());
    if (isNaN(hours) || hours < 0 || hours % 0.25 !== 0) {
      setInputError("Only non-negative fractions of 0.25 are allowed");
      return;
    }
    await onSave(hours, hours === 0 ? "" : textareaValue);
    onClose();
  }, [inputValue, textareaValue]);


  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sheno oret e punes" footer={
      <Button onClick={handleSave} disabled={!!inputError}>Save</Button>
    }>
      <div className="flex flex-col gap-4">
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
              setInputError("Only non-negative fractions of 0.25 are allowed");
            } else {
              setInputError(null);
            }
          }}
          className={`border rounded p-2 w-full ${inputError ? "border-red-500 bg-red-50" : "border-gray-300"}`}
        />
        {inputError && <p className="text-red-600 text-sm -mt-2">{inputError}</p>}
        <textarea
          value={textareaValue}
          onChange={(e) => setTextAreaValue(e.target.value)}
          className="border border-gray-300 rounded p-2"
          placeholder="Add a description for the working hour"
        />
      </div>
    </Modal>
  );
};
