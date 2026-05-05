# Add Preview Link + Survey Editing Workflow

## 1. Add "Internal Preview Link" on each client card

In `src/pages/AdminDashboard.tsx`, within the card's link section (currently just "Public Survey Link"), add a second block directly beneath it labeled "Internal Preview Link" that points to `/survey/{survey_uid}?preview=1`.

Behavior:
- Built the same way as `publicUrl`: `const previewUrl = ${publicUrl}?preview=1`.
- Same visual treatment as the public link block (eyebrow label + Copy button + monospaced URL box), but with a subtle distinction so admins don't confuse them — e.g. eyebrow text "Internal Preview Link (Admins Only)" and the URL box uses `border-dashed` instead of solid.
- Copy button uses a separate `copiedId` key (`${client.id}-preview`) so the "Copied" state on the two buttons is independent.
- The preview link only works for signed-in `@station16.com` users (already enforced in `ClientSurvey.tsx` via `isInternalPreview`); we'll add a one-line helper note under the eyebrow: "Requires Station16 sign-in".

No backend, schema, or edge-function changes.

```text
┌─ Card ──────────────────────────────┐
│ [status]                       [🗑] │
│ Client Name                         │
│ BUSINESS                            │
│ ACCESS CODE: 1234                   │
│ 0 RESPONSES GATHERED                │
│                                     │
│ [ ↳ Finish Surveys / View Strategy ]│
│ ─────────────────────────────────── │
│ PUBLIC SURVEY LINK     [Copy Link]  │
│ https://.../survey/abc              │
│                                     │
│ INTERNAL PREVIEW LINK  [Copy Link]  │
│ Requires Station16 sign-in          │
│ https://.../survey/abc?preview=1    │
└─────────────────────────────────────┘
```

## 2. Best way to edit the survey layout

The survey UI lives entirely in **`src/pages/ClientSurvey.tsx`**. Recommended workflow:

1. **Open it in preview** — sign in as a Station16 admin, then from the dashboard click "Copy Link" on the new Internal Preview Link and open it. The page skips the access-code gate and the final submit is short-circuited (no DB writes), so you can step through every section freely.
2. **Iterate by section** — the file is organized as discrete steps (intro → role → values spectrum → personality → perception → optional aesthetics → review). Tell me which step / which question / which visual element you want changed and I'll edit just that block.
3. **Question content vs. layout** — the value/personality/perception question arrays and the `getValuesSpectrum(client)` fork are also in `ClientSurvey.tsx`, so wording, ordering, conditional logic, and visual layout all live in one file. No need to touch the edge functions to reword or restyle questions.
4. **Header progress bar** uses the dynamic `totalSteps` derived from entity type, so adding/removing a step updates automatically.

When you want changes, the most efficient prompt pattern is: "On step N (e.g. 'Personality'), change X to Y" or "Restyle the value-spectrum slider to look like Z" — I can then make targeted edits without disturbing the rest of the flow.

## Files to change

- `src/pages/AdminDashboard.tsx` — add the preview link block + a `previewUrl` constant in the card render.
