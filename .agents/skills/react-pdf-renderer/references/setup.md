# Setup

## 1. Install

```bash
bun add @react-pdf/renderer
```

No Vite config changes are needed. `@react-pdf/renderer` ships browser-ready ESM.

## 2. Host fonts locally

Create `public/fonts/` and copy the `.ttf` (or `.otf`) files you need:

```
public/
└── fonts/
    ├── Inter-Regular.ttf
    ├── Inter-SemiBold.ttf
    └── Inter-Bold.ttf
```

Free font sources: Google Fonts download ZIP, Fontsource (`npm view @fontsource/<name>`), or the user's brand kit. Static files must end up under `public/` so Vite serves them at `/fonts/<file>.ttf`.

### Why not load fonts from Google Fonts CDN?

`@react-pdf/renderer` fetches font URLs server-side-style (no browser font cache, no CSS `@font-face` fallback). In Lovable sandboxed previews and many corporate networks the Google Fonts CSS endpoint returns 404 or a CORS-blocked CSS file that doesn't expose the underlying `.ttf`. Result: blank text or a "DataView" error mid-generation.

**Self-hosted TTFs avoid all of this.** They're served from the same origin as the app, so the fetch is trivially cacheable and never CORS-blocked.

## 3. Register fonts at module load

In the deck component file, before defining `StyleSheet`:

```ts
import { Font } from "@react-pdf/renderer";

const fontBase =
  typeof window !== "undefined" ? `${window.location.origin}/fonts` : "/fonts";

Font.register({
  family: "Inter",
  fonts: [
    { src: `${fontBase}/Inter-Regular.ttf`, fontWeight: 400 },
    { src: `${fontBase}/Inter-SemiBold.ttf`, fontWeight: 600 },
    { src: `${fontBase}/Inter-Bold.ttf`, fontWeight: 700 },
  ],
});

// Disable hyphenation so headings never break mid-word ("Audi-ence").
Font.registerHyphenationCallback((word) => [word]);
```

Use absolute URLs (`window.location.origin + ...`) rather than `/fonts/...`. Some preview environments resolve relative paths from an unexpected base, leading to 404s.
