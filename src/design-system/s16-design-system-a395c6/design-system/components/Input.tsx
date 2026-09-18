import { forwardRef, useId } from "react";
import type { InputHTMLAttributes } from "react";

import { cn } from "../lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Visible uppercase label; always provide one. */
  label: string;
  /** Helper copy below the field. */
  hint?: string;
  /** Error copy; presence marks the field invalid. */
  error?: string;
}

/** Single-line text field with label, hint, and error states. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className, id, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;

  return (
    <div className="s16-field">
      <label className="s16-field__label" htmlFor={inputId}>
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? messageId : undefined}
        className={cn("s16-input", error && "s16-input--invalid", className)}
        {...rest}
      />
      {error ? (
        <span id={messageId} className="s16-field__error">
          {error}
        </span>
      ) : hint ? (
        <span id={messageId} className="s16-field__hint">
          {hint}
        </span>
      ) : null}
    </div>
  );
});
