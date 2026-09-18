# Set up the Station16 design system

## Scope
- Load the attached Station16 theme after the app’s current global styles so its tokens and component styling take precedence.
- Wrap the full application in the Station16 theme provider so every existing screen inherits the correct canvas, typography, focus, and surface behavior.
- Replace the legacy global font/theme declarations that conflict with the attached system, while retaining Tailwind’s base and utility layers for existing layouts.
- Load the design system’s required font families in the document head and keep the existing app metadata intact.
- Verify the current admin screen and a public screen render correctly without changing workflows or data behavior.

## Technical details
- Import the managed theme from `@/design-system/s16-design-system-a395c6/design-system/styles/theme.css` once at the application entry point.
- Use `ThemeProvider` from `@/design-system/s16-design-system-a395c6` at the application root.
- Keep compatibility aliases for existing Station16 utility classes, but map them to managed `--s16-*` tokens instead of maintaining a second visual theme.
