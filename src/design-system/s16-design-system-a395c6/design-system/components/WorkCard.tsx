import { forwardRef } from "react";
import type { AnchorHTMLAttributes, ReactNode } from "react";

import { cn } from "../lib/cn";
import { Display } from "./Display";

export interface WorkCardProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Project name. */
  title: string;
  /** Comma-separated disciplines, e.g. "branding, web, design". */
  meta?: string;
  /** Image URL for the project thumbnail. */
  imageSrc?: string;
  /** Alt text for the thumbnail; required when imageSrc is set. */
  imageAlt?: string;
  /** Call to action text under the title. */
  action?: ReactNode;
}

/** Case-study teaser linking to a project. */
export const WorkCard = forwardRef<HTMLAnchorElement, WorkCardProps>(function WorkCard(
  { title, meta, imageSrc, imageAlt = "", action = "View Project", className, ...rest },
  ref,
) {
  return (
    <a ref={ref} className={cn("s16-work", className)} {...rest}>
      <div className="s16-work__media">
        {imageSrc ? <img src={imageSrc} alt={imageAlt} /> : null}
      </div>
      {meta ? <span className="s16-work__meta">{meta}</span> : null}
      <Display as="h3" size="sm">
        {title}
      </Display>
      <span className="s16-arrowlink">
        <span className="s16-arrowlink__glyph" aria-hidden="true">
          ↳
        </span>
        {action}
      </span>
    </a>
  );
});
