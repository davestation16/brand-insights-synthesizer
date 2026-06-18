# Troubleshooting

## "DataView" / "Unknown font format" error during `toBlob()`

Cause: a font URL returned HTML (a 404 page) or a CSS file instead of a TTF.

Fix:
1. Verify each `Font.register` `src` resolves to a real TTF by opening it directly in the browser.
2. Make sure files live under `public/fonts/` (not `src/assets/fonts`). Anything imported from `src` is hashed by Vite and won't match the absolute URL string.
3. Never load fonts from `fonts.googleapis.com` — see `setup.md`.

## Blank or "tofu" (□□□) text in the output

Cause: a `Text` is styled with a font family that wasn't registered, or with a weight that wasn't registered for that family.

Fix: every `fontWeight` you use in styles must have a matching `Font.register` entry. Register at minimum the weights you reference; extras are fine.

## Headings split mid-word ("Audi-\nence")

Cause: react-pdf's default hyphenation engine.

Fix: call this **once** at module load (we put it next to `Font.register`):

```ts
Font.registerHyphenationCallback((word) => [word]);
```

## A section gets split awkwardly across pages

Add `wrap={false}` to the `<View>` you want to keep together. Don't apply it to long content blocks — they'll overflow and clip.

## The PDF is huge (multi-MB)

- Strip unused weights from `Font.register`. Each registered face is embedded into the PDF.
- If you're embedding raster images, downscale them before passing to `<Image src=…/>`. React-pdf embeds the bytes verbatim.
- Prefer SVG (`<Svg>` element from `@react-pdf/renderer`) for logos and icons.

## "Module not found: @react-pdf/renderer" after install

The dev server is auto-restarted by Lovable on install; if a stale Vite cache lingers, restart the dev server.

## Page number shows `NaN` or doesn't update

`render={({ pageNumber, totalPages }) => ...}` only works inside a `<Text>` element placed in a `fixed` view, and only on a multi-page document. For single-page docs the value is correct but trivial.

## CSS variables / Tailwind classes do nothing

Expected — `@react-pdf/renderer` is its own renderer and ignores both. Use `StyleSheet.create` with hex colors and pt values.

## Generation hangs forever in mobile Safari

Usually OOM from embedding too many or too large images. Downscale images, split into a second `Page`, or move generation to a Lovable edge function with `@react-pdf/renderer` running server-side via `renderToBuffer`.
