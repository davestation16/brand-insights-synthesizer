import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "../lib/cn";

export type SectionTone = "canvas" | "sand" | "ink";

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  /** Background treatment; alternate tones to pace a page. */
  tone?: SectionTone;
  /** Set false to opt out of the centered max-width container. */
  contained?: boolean;
  children?: ReactNode;
}

/** Full-bleed page band with the system's vertical rhythm and container. */
export const Section = forwardRef<HTMLElement, SectionProps>(function Section(
  { tone = "canvas", contained = true, className, children, ...rest },
  ref,
) {
  return (
    <section ref={ref} className={cn("s16-section", `s16-section--${tone}`, className)} {...rest}>
      {contained ? <div className="s16-section__inner">{children}</div> : children}
    </section>
  );
});
