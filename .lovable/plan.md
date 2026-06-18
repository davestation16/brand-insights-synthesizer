# Skill: `react-pdf-renderer`

Save the PDF rendering approach used in this project as a reusable Lovable skill so it can be applied to other projects.

## Why a skill (not always-on knowledge)

PDF rendering is task-specific — it should load only when the user asks to add/export PDFs. A skill is the right shape.

## What makes this project's PDF rendering work well

After inspecting `src/components/BlueprintDeck.tsx` and `src/pages/AdminDashboard.tsx`, the winning recipe is:

1. **`@react-pdf/renderer`** (vector output) — not `html2canvas` + `jsPDF` (rasterized, blurry, font-fragile).
2. **Locally hosted fonts** in `public/fonts/*.ttf` registered via `Font.register({ src: \`${window.location.origin}/fonts/...\` })`. Avoids the Google Fonts CDN 404 / CORS errors that break PDF generation in sandboxed previews.
3. **`Font.registerHyphenationCallback((word) => [word])`** to stop react-pdf splitting headings like "Audi-ence".
4. **A dedicated deck component** (`BlueprintDeck`) returning `<Document><Page>...</Page></Document>` using `StyleSheet.create` — clean separation from on-screen UI.
5. **Client-side trigger** via `pdf(<Deck …/>).toBlob()` → object URL → anchor click. No server round-trip.
6. **Diagnostics buffer** in `localStorage` capturing each stage (render / blob / download / error) so users can copy a log when generation fails.

## Skill contents

Draft at `.agents/skills/react-pdf-renderer/`:

```
.agents/skills/react-pdf-renderer/
├── SKILL.md
└── references/
    ├── setup.md           # install, font hosting, vite gotchas
    ├── document-template.md  # annotated <Document>/<Page>/<View>/<Text> example
    ├── download-trigger.md   # pdf().toBlob() + diagnostics pattern
    └── troubleshooting.md    # font 404s, hyphenation, blank pages, large blobs
```

### `SKILL.md` (outline)

- **Frontmatter**
  - `name: react-pdf-renderer`
  - `description: Add high-quality vector PDF export to a Lovable React app using @react-pdf/renderer. Use when the user asks to download, export, or generate PDFs (brochures, decks, reports, invoices) from in-app content.`
- **Body**
  - When to use this skill / when not to (e.g. if the user wants pixel-perfect HTML capture, prefer a different approach).
  - Quick-start checklist (install, drop fonts in `public/fonts`, create deck component, wire download button).
  - Pointers to the four reference files.

### Reference files

- **`setup.md`** — `bun add @react-pdf/renderer`, where to put `.ttf` files, why CDN fonts fail, and a note that no Vite config changes are needed.
- **`document-template.md`** — minimal `Deck.tsx` template (Document/Page/StyleSheet/Font.register/hyphenation callback) adapted from `BlueprintDeck.tsx`, generic enough to drop into any project.
- **`download-trigger.md`** — the `handleDownloadPdf` pattern: `pdf(<Deck/>).toBlob()`, `URL.createObjectURL`, anchor click, `URL.revokeObjectURL`, plus the localStorage diagnostics buffer.
- **`troubleshooting.md`** — common failures: missing fonts → 404 / blank text, hyphenation in headings, oversized images, async font loading races, "DataView" errors from corrupt TTF.

## Apply

After writing the draft files, call `skills--apply_draft` with `.agents/skills/react-pdf-renderer` so it lands in the user's account-scoped skills and is available in future projects.

## Out of scope

- Copying the actual fonts from this project (licensing). The skill will tell the agent to source the fonts the new project needs.
- Project-specific layouts from `BlueprintDeck` (cover slide, persona slides, etc.) — the skill ships a generic template only.
