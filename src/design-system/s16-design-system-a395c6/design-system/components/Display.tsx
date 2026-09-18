import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "../lib/cn";

export type DisplaySize = "lg" | "md" | "sm";
export type DisplayFace = "serif" | "editorial";
export type DisplayLevel = "h1" | "h2" | "h3" | "h4";

export interface DisplayProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Semantic heading level; pick by document structure, not by size. */
  as?: DisplayLevel;
  /** Type scale step. */
  size?: DisplaySize;
  /** Headline face: the default serif, or the lighter editorial cut. */
  face?: DisplayFace;
  children?: ReactNode;
}

/** Serif display heading. */
export const Display = forwardRef<HTMLHeadingElement, DisplayProps>(function Display(
  { as: Tag = "h2", size = "md", face = "serif", className, children, ...rest },
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cn(
        "s16-display",
        `s16-display--${size}`,
        face === "editorial" && "s16-display--editorial",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
});
