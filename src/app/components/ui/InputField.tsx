import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react"; // eye icons
import { Button } from "@/components/ui/button";

type InputFieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  type?: string;
  placeholder: string;
  formId?: string | number;
  autoComplete?: string;
  error?: string;
};

export const InputField = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  formId,
  autoComplete,
  error
}: InputFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const id = `${name}-${formId ?? "new"}`;
  const isPasswordField = type === "password";
  const isRoleField = type === "role";
  const inputType = isPasswordField && showPassword ? "text" : type;
  const ROLE_OPTIONS = ["Dev", "Admin"];

  return (
    <>
      <label htmlFor={id} className="block font-semibold text-[#244B77] mb-1">{label}</label>
      {!isRoleField ? (<>
        <div className="relative">
          <input
            id={id}
            name={name}
            type={inputType}
            value={value}
            onChange={onChange}
            className="w-full border bg-[#D9D9D9] p-2 rounded-sm pr-10"
            placeholder={placeholder}
            autoComplete={autoComplete ?? "off"}
          />
          {isPasswordField && value !== "" && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2 text-[20px] py-1 text-[#363636] font-medium"
              aria-label={showPassword ? "Fshih fjalëkalimin" : "Shfaq fjalëkalimin"}
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </Button>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-500 mt-1">{error}</p>
        )}
      </>)
        :
        (
          <select
            name="role"
            value={value}
            onChange={onChange}

            className="border px-2 py-1 rounded w-full text-black font-normal"
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        )}
    </>
  );
};