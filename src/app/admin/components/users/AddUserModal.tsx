import React, { useState } from "react";
import { Modal } from "@/app/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { InputField } from "@/app/components/ui/InputField";

type Props = {
  open: boolean;
  formData: { id: number, username: string; email: string; password: string; role: string };
  onClose: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: () => void;
};

export function AddUserModal({ open, onClose, formData, onChange, onSubmit }: Props) {

  const isPasswordStrong = (password: string) => {
    return /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=.]).{8,}$/.test(password);
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Krijo user te ri"
      footer={<Button onClick={onSubmit}>Shto</Button>}
    >
      <p className="mb-4 text-left text-[#244B77] text-md">
        Plotësoni fushat përkatëse për të krijuar një user të ri dhe vendosni një password të sigurt.
      </p>
      <div className="flex flex-wrap gap-4">
        <div className="w-[45%]">
          <InputField formId={formData.id} label="Emri i plote:" name="username" value={formData.username} onChange={onChange} placeholder="Shembull: Andi Lazaj" />
        </div>
        <div className="w-[45%]">
          <InputField formId={formData.id} label="Email:" name="email" value={formData.email} onChange={onChange} placeholder="Shembull: andi@example.com" />
        </div>
        <div className="w-[45%]">
          <InputField formId={formData.id} label="Password:" name="password" value={formData.password} onChange={onChange} type="password" placeholder="Shembull: ********" autoComplete="new-password"
            error={
              formData.password && !isPasswordStrong(formData.password)
                ? "Password duhet të jetë të paktën 8 karaktere, një shkronjë të madhe, një numër dhe një simbol special."
                : ""
            } />
        </div>
        <div className="w-[45%]">
          <InputField formId={formData.id} label="Roli:" name="role" type="role" value={formData.role} onChange={onChange} placeholder="Shembull: Dev" />
        </div>
      </div>
    </Modal>
  );
}
