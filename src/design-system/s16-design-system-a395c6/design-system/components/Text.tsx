import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "../lib/cn";

export type TextSize = "lead" | "body" | "small";
export type TextTone = "default" | "muted" | "inverse";

export interface TextProps extends HTMLAttributes<HTMLParagraphElement> {
  /** Type scale step. */
  size?: TextSize;
  /** Color treatment. */
  tone?: TextTone;
  /** Render as a different element, e.g. "span" or "div". */
  as?: "p" | "span" | "div";
  children?: ReactNode;
}

/** Body copy in Inter, at the system's three reading sizes. */
export const Text = forwardRef<HTMLParagraphElement, TextProps>(function Text(
  { size = "body", tone = "default", as: Tag = "p", className, children, ...rest },
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cn(
        "s16-text",
        `s16-text--${size}`,
        tone === "muted" && "s16-text--muted",
        tone === "inverse" && "s16-text--inverse",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
});
