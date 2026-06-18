---
name: react-pdf-renderer
description: Add high-quality vector PDF export to a Lovable React app using @react-pdf/renderer. Use when the user asks to download, export, generate, or print PDFs (brochures, decks, reports, invoices, certificates) from in-app content.
---

# React PDF Renderer

Reliable, vector-quality PDF export for Lovable React apps. Built from a production project that ships multi-page branded decks with custom fonts.

## When to use

- User wants to **download / export / generate a PDF** of structured data (report, deck, invoice, certificate, brochure).
- User wants **custom fonts**, multi-page layouts, headers/footers, page numbers.
- Content is structured data the agent can lay out — not an arbitrary existing DOM screenshot.

## When NOT to use

- User wants a pixel-perfect snapshot of an existing complex HTML page (charts, maps, third-party embeds). Use `html2canvas` + `jsPDF` or a server-side headless-browser approach instead.
- User wants the browser's native Print dialog only — just use `window.print()` with `@media print` CSS.

## Why this approach wins

1. **Vector output** — sharp text and shapes at any zoom; tiny file sizes.
2. **Real fonts** — TTFs registered in code, not screenshotted.
3. **No server** — generated in the browser via `pdf(<Doc/>).toBlob()`.
4. **Deterministic** — pure React; no race with layout/animation/canvas timing.

## Quick-start checklist

1. `bun add @react-pdf/renderer`
2. Drop `.ttf` font files in `public/fonts/`. **Do not** load fonts from Google Fonts / a CDN — see `references/setup.md` for why.
3. Create a `Deck.tsx` (or `Report.tsx`, `Invoice.tsx`, …) returning `<Document><Page>...</Page></Document>`. Use `references/document-template.md` as the starting point.
4. Wire a download button using the `pdf(<Deck/>).toBlob()` pattern in `references/download-trigger.md`.
5. If anything misbehaves, consult `references/troubleshooting.md` before changing the recipe.

## References

- `references/setup.md` — install + font hosting + Vite notes.
- `references/document-template.md` — annotated minimal Document/Page template.
- `references/download-trigger.md` — client-side download trigger + diagnostics buffer.
- `references/troubleshooting.md` — font 404s, hyphenation, blank pages, oversized blobs.

## Hard rules

- **Always self-host fonts** under `public/fonts/`. Never reference `fonts.googleapis.com` or other remote font URLs from `Font.register`.
- **Always call** `Font.registerHyphenationCallback((w) => [w])` once at module load, otherwise headings break mid-word.
- **Never** put `@react-pdf/renderer` JSX inside your normal on-screen React tree. It's a separate renderer — keep the deck component in its own file and only instantiate it via `pdf(...)`.
