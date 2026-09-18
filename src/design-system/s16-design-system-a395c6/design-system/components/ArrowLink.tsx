import { forwardRef } from "react";
import type { AnchorHTMLAttributes, ReactNode } from "react";

import { cn } from "../lib/cn";

export type ArrowLinkTone = "ink" | "inverse";

export interface ArrowLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Color treatment for light or dark surfaces. */
  tone?: ArrowLinkTone;
  children?: ReactNode;
}

/** The "↳ Learn How" navigational link that runs through the brand. */
export const ArrowLink = forwardRef<HTMLAnchorElement, ArrowLinkProps>(function ArrowLink(
  { tone = "ink", className, children, ...rest },
  ref,
) {
  return (
    <a
      ref={ref}
      className={cn("s16-arrowlink", tone === "inverse" && "s16-arrowlink--inverse", className)}
      {...rest}
    >
      <span className="s16-arrowlink__glyph" aria-hidden="true">
        ↳
      </span>
      {children}
    </a>
  );
});
