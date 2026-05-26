## Editable PDF fields in the analysis modal (auto-save on blur)

Replace the read-only markdown render in the strategy modal with a structured editor whose fields map 1:1 to `presentation_data`. Edits persist to the `clients.presentation_data` JSONB column on blur and feed the PDF download immediately.

### Scope
- Surface: the modal opened from "View Results" in `AdminDashboard.tsx` (currently lines ~582–680).
- Source of truth becomes `selectedStrategy.presentationData`. The markdown `blueprint` text is kept as-is (still shown to AI/history), but is no longer the editable surface.
- Sections rendered & editable (matching `PresentationData` and `BlueprintDeck` slides):
  1. Perception Gap — Alignment, Disconnect (rich text)
  2. Core Values — list of { name, description }, add/remove/reorder
  3. Key Attributes — pills (chip input) + summary (rich text)
  4. Primary Personality — trait (text) + why (rich text)
  5. Secondary Personality — trait + why
  6. Voice & Tone — adjectives (chips), inPractice (rich text), communicationStrategy (rich text), dos & don'ts (chips)
  7. Primary Archetype — name (text) + description (rich text)
  8. Secondary Archetypes (2–4) — list of { name, description }, add/remove (capped at 4, min 2)
  9. Personas — list of { title, narrative }, add/remove
  10. Aesthetic (only if present) — summary, palette, materials, style (rich text each)

### Editor behavior
- **Rich text** for prose fields: reuse existing `src/components/RichTextEditor.tsx` (Tiptap). Strip to plain text on save — the PDF (`@react-pdf/renderer`) doesn't render HTML, so we persist plain text with paragraph breaks preserved as `\n\n`. This keeps the PDF clean and matches today's rendering. Bold/italic/lists shown in the editor are visual aids for the analyst.
- **Short text** (trait names, archetype names, persona titles, aesthetic palette keyword) use a styled single-line input.
- **Chip inputs** for `pills`, `adjectives`, `dosAndDonts`: type + Enter to add, click × to remove, drag to reorder (use simple up/down buttons to avoid pulling a DnD lib).
- **Add/remove** controls on list sections (Core Values, Secondary Archetypes, Personas) with sensible min/max (Core Values ≤4, Secondary Archetypes 2–4, Personas ≤3 — matches what `BlueprintDeck` renders).

### Auto-save on blur
- Each field debounces on blur (~250ms) and patches `presentation_data` for the client.
- Optimistic local update: `selectedStrategy.presentationData` mutates immediately so the PDF download reflects the edit without waiting for the network.
- Persistence: `supabase.from("clients").update({ presentation_data }).eq("id", client.id)`.
- Header status pill: `Saving…` → `Saved` (auto-clears after 2s) → `Save failed — retry` on error (click retries the last patch).
- Concurrency: keep a single in-flight save per modal; if another blur fires while saving, queue one trailing save.

### UX layout
- Keep the existing modal chrome (header with Download PDF + Close, Contributors block, PDF Diagnostics block).
- Below diagnostics, render the structured editor instead of the markdown block. Section headings reuse the existing display/heading styles (`font-display`, eyebrow labels) so it visually matches the current read-only look.
- Each section has the section title, an eyebrow label, and the fields below.
- The raw markdown summary is hidden from the modal. (Optional: a collapsed "Show original AI markdown" disclosure at the bottom for reference — read-only.)

### Files touched
- `src/pages/AdminDashboard.tsx` — replace markdown block with the new structured editor; wire auto-save.
- `src/components/StrategyEditor.tsx` — **new**. Owns all section editors and per-field blur handlers. Takes `value: PresentationData`, `onChange(next)`, `saveStatus`.
- `src/components/ChipInput.tsx` — **new**. Tiny controlled chip input for pills / adjectives / dos & don'ts.
- `src/components/RichTextEditor.tsx` — extend `onBlur` prop (currently only `onChange`) so the parent can trigger save without saving on every keystroke. Add an option to emit plain text (`\n\n` paragraph joins) for the PDF-bound fields.

### Edge cases
- Existing rows whose `presentation_data` is missing or partial: render empty defaults; saving fills them in.
- PDF currently throws if `presentation_data` isn't valid (`isPresentationData`). Editor enforces required shape (no empty trait/name on primary fields) before allowing PDF download — disable the Download button with a tooltip if invalid.
- Aesthetic section only renders if `client.include_aesthetics` is true AND `presentation_data.aesthetic` exists; provide an "Add aesthetic section" button when missing.

### Out of scope
- Re-generating from the AI
- Editing the raw markdown (now reference-only)
- Versioning / change history beyond the editor's built-in undo