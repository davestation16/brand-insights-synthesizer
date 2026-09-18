import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "../lib/cn";

export interface ThemeProviderProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

/**
 * Applies the Station16 theme scope. Wrap the app once, and import
 * `@/design-system/s16-design-system-a395c6/design-system/styles/theme.css` once, so tokens, fonts, focus rings and
 * ink-surface overrides resolve for everything inside.
 */
export const ThemeProvider = forwardRef<HTMLDivElement, ThemeProviderProps>(function ThemeProvider(
  { className, children, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cn("s16-root", className)} {...rest}>
      {children}
    </div>
  );
});
