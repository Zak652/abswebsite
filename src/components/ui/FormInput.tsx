"use client";

import { forwardRef } from "react";

interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, hint, id, className = "", ...props }, ref) => {
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
        <input
          ref={ref}
          id={inputId}
          className={`
            h-11 px-3.5 rounded-xl border text-sm bg-white
            text-neutral-900 placeholder:text-neutral-400
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
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-xs text-[var(--color-error)] flex items-center gap-1"
            role="alert"
          >
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs text-neutral-500">{hint}</p>
        )}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";
