import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "../lib/cn";

export type ThemeMode = "light" | "dark";

export interface ThemeProviderProps extends HTMLAttributes<HTMLDivElement> {
  /** Which theme to scope. Defaults to the light (paper) theme. */
  mode?: ThemeMode;
  children?: ReactNode;
}

/**
 * Applies the Station16 theme scope. Wrap the app once, and import
 * `@/design-system/s16-design-system-a395c6/design-system/styles/theme.css` once, so tokens, fonts, focus rings and
 * ink-surface overrides resolve for everything inside.
 *
 * Pass `mode="dark"` for the dark theme. Providers can be nested, so a single
 * region can run dark inside an otherwise light app.
 */
export const ThemeProvider = forwardRef<HTMLDivElement, ThemeProviderProps>(function ThemeProvider(
  { className, mode = "light", children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      data-s16-theme={mode}
      className={cn("s16-root", mode === "dark" && "s16-root--dark", className)}
      {...rest}
    >
      {children}
    </div>
  );
});
