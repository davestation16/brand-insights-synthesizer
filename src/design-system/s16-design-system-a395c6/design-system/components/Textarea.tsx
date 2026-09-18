import { forwardRef, useId } from "react";
import type { TextareaHTMLAttributes } from "react";

import { cn } from "../lib/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Visible uppercase label; always provide one. */
  label: string;
  /** Helper copy below the field. */
  hint?: string;
  /** Error copy; presence marks the field invalid. */
  error?: string;
}

/** Multi-line text field matching Input's label, hint, and error behavior. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, id, ...rest },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const messageId = `${fieldId}-message`;

  return (
    <div className="s16-field">
      <label className="s16-field__label" htmlFor={fieldId}>
        {label}
      </label>
      <textarea
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? messageId : undefined}
        className={cn("s16-input", "s16-input--textarea", error && "s16-input--invalid", className)}
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
