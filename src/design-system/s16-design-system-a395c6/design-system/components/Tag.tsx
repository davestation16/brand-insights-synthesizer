import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "../lib/cn";

export type TagVariant = "accent" | "ink" | "outline";

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  /** Visual style. */
  variant?: TagVariant;
  children?: ReactNode;
}

/** Small uppercase chip for categories such as "branding, web, design". */
export const Tag = forwardRef<HTMLSpanElement, TagProps>(function Tag(
  { variant = "accent", className, children, ...rest },
  ref,
) {
  return (
    <span ref={ref} className={cn("s16-tag", `s16-tag--${variant}`, className)} {...rest}>
      {children}
    </span>
  );
});
