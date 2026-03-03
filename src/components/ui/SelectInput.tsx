"use client";

import { forwardRef } from "react";

interface SelectInputProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const SelectInput = forwardRef<HTMLSelectElement, SelectInputProps>(
  ({ label, error, options, placeholder, id, className = "", ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-neutral-700"
        >
          {label}
          {props.required && <span className="text-[var(--color-error)] ml-0.5">*</span>}
        </label>
        <select
          ref={ref}
          id={inputId}
          className={`
            h-11 px-3.5 rounded-xl border text-sm bg-white
            text-neutral-900
            transition-colors duration-150 outline-none
            ${error
              ? "border-[var(--color-error)] focus:ring-2 focus:ring-[var(--color-error)]/20"
              : "border-neutral-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            }
            disabled:bg-neutral-100 disabled:cursor-not-allowed
            ${className}
          `}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-xs text-[var(--color-error)]"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

SelectInput.displayName = "SelectInput";
