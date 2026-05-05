# Station16 Brand Onboarding Platform — Internal Documentation

> **Audience:** Station16 team only. This `docs/` folder is not linked from the public app and is for internal reference.

## 1. Purpose

A private internal tool used by **Station16** (a premium branding agency) to onboard new clients. It collects structured discovery surveys from multiple stakeholders associated with a client, then synthesizes those responses into a **Brand Strategy Blueprint** using AI.

The platform replaces ad-hoc onboarding decks and shared docs with:

- A controlled link + access code per client
- Role-tagged responses across many stakeholders
- A single, beautifully-formatted strategy report generated on demand

## 2. Roles & Access Model

| Role                | How they enter                                             | What they can do                                                               |
| ------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Agency admin**    | Google sign-in restricted to `@station16.com` (`hd` param) | Create clients, share survey link + code, generate strategy, view blueprint    |
| **Stakeholder**     | Public `/survey/:uid` link + numeric access code           | Fill in one survey response (Internal / Involved / Proximate role)             |
| **Dev/Test**        | Email/password form below the separator on `/`             | Local development only                                                         |

Admin gating lives in `src/App.tsx` (`isAdmin()` checks `email.endsWith("@station16.com")`).

## 3. Survey Logic — Forked by Entity Type

A client is either a **Business** or an **Organization**. The survey in `src/pages/ClientSurvey.tsx` forks accordingly:

- `getValuesSpectrum(client)` returns different value-spectrum questions per entity type, interpolating the client name into each `question`.
- **Business** flow: 3 sections (Values → Personality → Perception). Final step submits.
- **Organization** flow: 4 sections (adds **Aesthetic Choices** as step 4).
- The progress bar uses a dynamic `totalSteps` so both flows fill correctly.
- The "Next Section" button auto-relabels to "Submit Knowledge" on the last step for the entity type.

Each respondent also picks a **Role** which the AI uses to segment the analysis (Internal / Involved / Proximate).

## 4. Multi-Stakeholder Submission Model

Earlier versions generated the AI blueprint immediately after each submission. This was decoupled (see `.lovable/plan.md`):

1. Stakeholder submits → `submit-survey` edge function:
   - Validates access code
   - Inserts row into `surveys`
   - Increments `clients.response_count`
   - **Does not** flip `clients.status` and **does not** call the AI
2. Admin watches `response_count` rise on each client card.
3. When ready, admin clicks **"Finish Surveys & Generate Strategy"** → invokes `generate-blueprint`, which:
   - Aggregates all `surveys.responses` for the client
   - Calls Lovable AI Gateway (`google/gemini-2.5-pro`)
   - Saves Markdown into `clients.blueprint` and sets `clients.status = 'completed'`
4. Admin clicks **"View Strategy"** → modal renders the blueprint via `react-markdown` with custom Tailwind styling.

## 5. AI Prompt Contract

Defined in `supabase/functions/generate-blueprint/index.ts` as `SYSTEM_PROMPT`. Key rules:

- Segment respondents by their `role` field into **Internal / Involved / Proximate** (labels shift based on entity type).
- Output Markdown with these exact sections:
  1. Perception Gap Analysis
  2. The Brand's Soul (Values & Attributes)
  3. Core Brand Personality
  4. Voice + Tone
  5. Brand Archetypes
  6. Visual & Aesthetic Projection — **omitted entirely for Businesses**, renumber 7 → 6
  7. Target Audience Personas (2 invented profiles)

User prompt passes `client.name`, `client.entity_type`, `totalRespondents`, and the full `allResponses` array.

## 6. Data Model

`public.clients`

| Column           | Notes                                              |
| ---------------- | -------------------------------------------------- |
| `id`             | uuid PK                                            |
| `name`           | client display name                                |
| `survey_uid`     | random string used in `/survey/:uid`               |
| `access_code`    | 4-digit numeric code shared with stakeholders      |
| `entity_type`    | `"Business"` or `"Organization"`                   |
| `status`         | `"pending"` until blueprint generated, then `"completed"` |
| `response_count` | int, NOT NULL DEFAULT 0, incremented per submission |
| `blueprint`      | Markdown text, populated by `generate-blueprint`   |
| `created_at`     | timestamp                                          |

`public.surveys`

| Column         | Notes                                         |
| -------------- | --------------------------------------------- |
| `id`           | uuid PK                                       |
| `client_id`    | FK → `clients.id`                             |
| `responses`    | jsonb — full survey payload incl. `role`      |
| `access_code`  | mirrored for audit                            |
| `submitted_at` | timestamp                                     |

## 7. Key Files

| Path                                              | Responsibility                                                         |
| ------------------------------------------------- | ---------------------------------------------------------------------- |
| `src/App.tsx`                                     | Routing + admin gating via `@station16.com`                            |
| `src/pages/Login.tsx`                             | Google OAuth (`hd: "station16.com"`) + dev/test form                   |
| `src/pages/AdminDashboard.tsx`                    | Client list, create client, generate + view strategy modal             |
| `src/pages/ClientSurvey.tsx`                      | Public survey, entity-forked questions, progress bar                   |
| `supabase/functions/submit-survey/index.ts`       | Validate code, insert response, bump `response_count`                  |
| `supabase/functions/generate-blueprint/index.ts`  | Aggregate responses, call AI Gateway, save blueprint                   |
| `src/integrations/lovable/index.ts`               | Lovable Cloud OAuth wrapper (auto-generated; do not edit)              |

## 8. Roadmap

### ✅ Done

- Lovable Cloud + database schema (`clients`, `surveys`)
- Google sign-in with `@station16.com` domain restriction
- Admin dashboard: create / delete clients, copy public link, copy access code
- Public survey at `/survey/:uid` with access-code gate
- Entity-type forking (Business vs Organization) with dynamic step count
- Multi-stakeholder submission decoupled from AI generation
- `response_count` surfaced on each client card
- Admin-triggered "Finish Surveys & Generate Strategy" action
- Senior Brand Strategist system prompt with role segmentation + conditional sections
- Blueprint rendered as styled Markdown (`react-markdown` + Tailwind component overrides)
- Contributors summary (role counts) shown above the blueprint
- Realtime client list updates via Supabase channel

### 🟡 Possible next steps

- Per-stakeholder invite emails (transactional email infra)
- Regenerate / iterate on a blueprint after additional responses arrive
- Export blueprint as PDF / shareable read-only link for the client
- Per-question analytics view (heatmap of Internal vs Proximate gaps)
- Soft-delete + audit log on clients and surveys
- Admin user management (replace domain-only check with a `user_roles` table)
- Survey resume / partial save for long stakeholder forms
- i18n for the public survey

### 🔒 Known constraints

- Roles are derived from email domain, not a `user_roles` table. Acceptable while access is limited to `@station16.com`; revisit if external collaborators need admin access.
- AI generation is one-shot — re-running overwrites the previous blueprint with no version history.
- `surveys.blueprint` and `surveys.processed_at` columns exist from earlier per-survey AI flow and are no longer written. Safe to drop in a future cleanup migration.

## 9. Local Development Notes

- `src/integrations/supabase/client.ts` and `types.ts` are auto-generated — never edit.
- Edge functions deploy automatically on save; no manual deploy step.
- `LOVABLE_API_KEY` is provided by Lovable Cloud at runtime to edge functions; no setup needed.
- Dev/test login form on `/` is the fastest way to impersonate a non-admin during development.
