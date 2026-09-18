import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "../lib/cn";
import { Display } from "./Display";
import { Text } from "./Text";

export interface NumberedItemProps extends HTMLAttributes<HTMLDivElement> {
  /** Sequence marker, rendered as given (e.g. "01"). */
  index: string;
  /** Item heading. */
  title: string;
  /** Supporting copy; overrides children when both are set. */
  description?: string;
  children?: ReactNode;
}

/** Numbered service or process entry ("01 Foundation & Strategy"). */
export const NumberedItem = forwardRef<HTMLDivElement, NumberedItemProps>(function NumberedItem(
  { index, title, description, className, children, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cn("s16-numbered", className)} {...rest}>
      <span className="s16-numbered__index">{index}</span>
      <Display as="h3" size="sm">
        {title}
      </Display>
      {description ? (
        <Text tone="muted">{description}</Text>
      ) : (
        children
      )}
    </div>
  );
});
