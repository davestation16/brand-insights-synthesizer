## Goal
Add a per-client "Strategic Input Terminal" modal that captures two qualitative inputs — a short Operational Synopsis and a large Supporting Content / Transcripts blob — persists both on the client row, and feeds them into the `generate-blueprint` edge function to sharpen Supporting Character archetype selection.

## Changes

### 1. Database (migration)
Add two nullable columns to `public.clients`:
- `client_context text` — 3–5 sentence operational synopsis
- `supporting_content text` — pasted/loaded transcripts and discovery notes

No grant/RLS changes needed (existing admin-only policies already cover the table).

### 2. `src/pages/AdminDashboard.tsx`
- Extend the `Client` type with `client_context: string | null` and `supporting_content: string | null`, and include both in the `load()` select.
- Build an inline `GenerateBlueprintModal` component opened from both "Finish Surveys & Generate Strategy" and "Regenerate Strategy" buttons (replacing the direct `handleFinishSurveys` invocation).
- Modal layout — "Strategic Input Terminal for {client.name}":
  - **Field 1 — Operational Synopsis**
    - `<Label>`: "Client Context / Operational Synopsis (3–5 Sentences)"
    - `<Textarea>` (shadcn), ~4 rows
    - Placeholder: *"e.g., We handle tax structuring for high-net-worth private jet acquisitions. It's a regulatory minefield where errors cost millions; we act as an impenetrable legal shield so clients can enjoy wealth without audit anxiety."*
    - State: `clientContext`, seeded from `client.client_context ?? ""`
  - **Field 2 — Supporting Content & Transcripts**
    - `<Label>`: "Supporting Content & Meeting Transcripts"
    - Subtext: "Paste raw discovery notes, Zoom transcripts, or drop a text file below to inject qualitative voice into the AI analysis."
    - `<Textarea>`, large (~12 rows, vertically resizable)
    - File picker button underneath: hidden `<input type="file" accept=".txt,text/plain">` driven by a styled `<Button variant="outline">↳ Load .txt File</Button>`
    - On change: `new FileReader().readAsText(file)`; on `onload`, append the result to `supportingContent` (with a `\n\n--- {filename} ---\n` separator if existing content is non-empty). Reset the input value so the same file can be re-loaded.
    - State: `supportingContent`, seeded from `client.supporting_content ?? ""`
  - Footer: Cancel + "↳ Generate Strategy" (reuses existing `finishingId` spinner styling).
- Submit handler:
  ```ts
  await supabase.from("clients").update({
    client_context: clientContext,
    supporting_content: supportingContent,
  }).eq("id", client.id);

  const { data, error } = await supabase.functions.invoke("generate-blueprint", {
    body: { clientId: client.id, clientContext, supportingContent },
  });
  ```
  On success: close modal, clear `finishingId`, `load()`. On error: keep the existing `alert(...)` flow.

### 3. `supabase/functions/generate-blueprint/index.ts`
- Parse optional `clientContext` and `supportingContent` strings from the request body.
- When non-empty, prepend distinct labeled blocks to the user prompt:
  ```
  Strategist-Provided Client Context (authoritative — weight heavily in Step 3 of the Supporting Character workflow):
  <clientContext>

  Supporting Content & Meeting Transcripts (verbatim qualitative voice — mine for vulnerabilities, quests, and exact language):
  <supportingContent>
  ```
- Add a sentence to `SYSTEM_PROMPT` instructing the model to treat the Strategist-Provided Client Context as the highest-priority signal when reverse-engineering the archetype, and to mine the Supporting Content for persona language and vulnerabilities — both override superficial industry inference when they conflict.
- No output schema changes; still returns `{ markdown, presentationData }`.

## Out of scope
- No new storage buckets, no server-side file parsing (`.txt` only, read client-side via `FileReader`).
- No changes to PDF, StrategyEditor, or XLSX export.
- Survey respondents never see either field.
