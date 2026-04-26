import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="form-field">
      <span className="form-field__label">{label}</span>
      {children}
    </label>
  );
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className = "", ...props }, ref) {
    return <input ref={ref} className={`form-input ${className}`.trim()} {...props} />;
  },
);

export function SelectInput({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`form-input form-input--select ${className}`.trim()} {...props} />;
}
