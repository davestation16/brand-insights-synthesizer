import { forwardRef } from "react";
import type { HTMLAttributes } from "react";

import { cn } from "../lib/cn";

export interface StatProps extends HTMLAttributes<HTMLDivElement> {
  /** The figure, e.g. "14+". */
  value: string;
  /** What the figure counts, e.g. "Years of storytelling". */
  label: string;
}

/** Proof-point figure used in credibility rows. */
export const Stat = forwardRef<HTMLDivElement, StatProps>(function Stat(
  { value, label, className, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cn("s16-stat", className)} {...rest}>
      <span className="s16-stat__value">{value}</span>
      <span className="s16-stat__label">{label}</span>
    </div>
  );
});
