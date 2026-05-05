# Multi-stakeholder survey submissions

Right now, when a respondent finishes the public survey, the `submit-survey` edge function inserts the response, marks the client `completed`, and immediately calls the Lovable AI Gateway to generate the Brand Strategy Blueprint. We need to decouple these so multiple stakeholders can submit before the agency triggers the AI synthesis manually.

## Changes

### 1. Database
- Add a `response_count` integer column to `public.clients`, `NOT NULL DEFAULT 0`.

### 2. Edge function `submit-survey`
- Validate the access code against the client (unchanged).
- Insert the response into `surveys` (unchanged).
- Increment `clients.response_count` by 1 for the client.
- Stop updating `clients.status` — it stays `pending`.
- Remove the Lovable AI Gateway call and the blueprint update from this function.

### 3. Frontend `src/pages/ClientSurvey.tsx`
- No code changes needed — it already calls the edge function and shows the "Discovery Complete" thank‑you screen, which still works since the client status is no longer flipped.

### 4. Admin dashboard `src/pages/AdminDashboard.tsx`
- Show the new `response_count` next to each client card so the team can see how many stakeholders have submitted.
- "View Strategy" was previously gated on `status === 'completed'`. Since status now stays `pending`, change the card to always show the response count and (later) a separate trigger for AI generation. For this task we just surface the count and leave the existing "View Strategy" button visible whenever a blueprint exists on any survey row — but since the AI step is being removed here, the button simply won't have anything to show yet. We'll keep a placeholder "View Strategy" affordance hidden until a blueprint exists.

A follow‑up step (not in this task) will add an admin‑triggered "Generate Strategy" action that calls a separate edge function to run the AI synthesis across all collected responses.

## Files touched
- New migration: `ALTER TABLE public.clients ADD COLUMN response_count integer NOT NULL DEFAULT 0;`
- `supabase/functions/submit-survey/index.ts` — strip AI + status update, add response_count increment
- `src/pages/AdminDashboard.tsx` — display `response_count`, hide "View Strategy" until a blueprint exists
