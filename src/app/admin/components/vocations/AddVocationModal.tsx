import { Modal } from "@/app/components/ui/Modal";
import { Button } from "@/components/ui/button";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  data: { date: string; holiday: string };
  onChange: (e: React.ChangeEvent<HTMLInputElement>, field: "date" | "holiday") => void;
  onSubmit: () => void;
};

export default function AddVocationModal({ isOpen, onClose, data, onChange, onSubmit }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold mb-4 text-[#244B77]">Shto Pushim</h2>
      <div className="space-y-4">
        <input
          placeholder="Data"
          type="date"
          className="w-full border rounded px-3 py-2"
          value={data.date}
          onChange={(e) => onChange(e, "date")}
        />
        <input
          placeholder="Emri i pushimit"
          type="text"
          className="w-full border rounded px-3 py-2"
          value={data.holiday}
          onChange={(e) => onChange(e, "holiday")}
        />
        <Button className="w-full" onClick={onSubmit}>
          Shto
        </Button>
      </div>
    </Modal>
  );
}
