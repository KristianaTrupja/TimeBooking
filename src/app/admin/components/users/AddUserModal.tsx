import React, { useState } from "react";
import { Modal } from "@/app/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { InputField } from "@/app/components/ui/InputField";
import { isPasswordStrong } from "@/lib/utils";

type Props = {
  open: boolean;
  formData: { id: number, username: string; email: string; password: string; role: string };
  onClose: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: () => void;
};

export function AddUserModal({ open, onClose, formData, onChange, onSubmit }: Props) {
  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Create a new employee"
      footer={<Button onClick={onSubmit}>Add</Button>}
    >
      <p className="mb-4 text-left text-[#244B77] text-md">
        Fill in the required fields to create a new user and set a secure password.
      </p>
      <div className="flex flex-wrap gap-4">
        <div className="w-[45%]">
          <InputField formId={formData.id} label="Full Name:" name="username" value={formData.username} onChange={onChange} placeholder="Example: John Doe" />
        </div>
        <div className="w-[45%]">
          <InputField formId={formData.id} label="Email:" name="email" value={formData.email} onChange={onChange} placeholder="Example: jdoe@example.com" />
        </div>
        <div className="w-[45%]">
          <InputField formId={formData.id} label="Password:" name="password" value={formData.password} onChange={onChange} type="password" placeholder="Example: ********" autoComplete="new-password"
            error={
              formData.password && !isPasswordStrong(formData.password)
                ? "The password must be at least 8 characters long, contain an uppercase letter, a number, and a special symbol."
                : ""
            } />
        </div>
        <div className="w-[45%]">
          <InputField formId={formData.id} label="Roli:" name="role" type="role" value={formData.role} onChange={onChange} placeholder="Example: Dev" />
        </div>
      </div>
    </Modal>
  );
}
