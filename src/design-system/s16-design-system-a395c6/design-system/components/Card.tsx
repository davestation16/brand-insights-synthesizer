import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "../lib/cn";

export type CardVariant = "plain" | "sand" | "ink" | "outline";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Surface treatment. */
  variant?: CardVariant;
  /** Adds hover lift; pair with a real link or button inside. */
  interactive?: boolean;
  children?: ReactNode;
}

/** Content surface used for services, notes, and supporting panels. */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = "plain", interactive = false, className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "s16-card",
        `s16-card--${variant}`,
        interactive && "s16-card--interactive",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});
