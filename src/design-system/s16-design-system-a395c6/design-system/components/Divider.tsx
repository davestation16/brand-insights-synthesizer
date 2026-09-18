import { forwardRef } from "react";
import type { HTMLAttributes } from "react";

import { cn } from "../lib/cn";

export type DividerTone = "subtle" | "accent";

export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  /** Line color treatment. */
  tone?: DividerTone;
}

/** Hairline rule used to separate editorial blocks. */
export const Divider = forwardRef<HTMLHRElement, DividerProps>(function Divider(
  { tone = "subtle", className, ...rest },
  ref,
) {
  return (
    <hr
      ref={ref}
      className={cn("s16-divider", tone === "accent" && "s16-divider--accent", className)}
      {...rest}
    />
  );
});
