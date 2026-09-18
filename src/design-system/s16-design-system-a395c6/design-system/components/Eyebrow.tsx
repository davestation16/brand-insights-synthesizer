import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "../lib/cn";

export type EyebrowTone = "accent" | "ink" | "muted";

export interface EyebrowProps extends HTMLAttributes<HTMLParagraphElement> {
  /** Color treatment. */
  tone?: EyebrowTone;
  children?: ReactNode;
}

/** Small uppercase label that sits above a display heading. */
export const Eyebrow = forwardRef<HTMLParagraphElement, EyebrowProps>(function Eyebrow(
  { tone = "accent", className, children, ...rest },
  ref,
) {
  return (
    <p ref={ref} className={cn("s16-eyebrow", `s16-eyebrow--${tone}`, className)} {...rest}>
      {children}
    </p>
  );
});
