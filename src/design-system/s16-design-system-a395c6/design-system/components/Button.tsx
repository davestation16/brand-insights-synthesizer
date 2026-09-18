import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "../lib/cn";

export type ButtonVariant = "primary" | "ink" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";
export type ButtonShape = "square" | "pill";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. */
  variant?: ButtonVariant;
  /** Control scale. */
  size?: ButtonSize;
  /** Corner treatment; the brand default is square. */
  shape?: ButtonShape;
  /** Leading arrow glyph, the Station16 action motif. */
  withArrow?: boolean;
  children?: ReactNode;
}

/** Square-edged uppercase action in the Station16 voice. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", shape = "square", withArrow = false, className, children, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "s16-button",
        `s16-button--${variant}`,
        `s16-button--${size}`,
        shape === "pill" && "s16-button--pill",
        className,
      )}
      {...rest}
    >
      {withArrow ? <span aria-hidden="true">↳</span> : null}
      {children}
    </button>
  );
});
