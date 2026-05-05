# Survey Template Management

Replace the hardcoded survey content in `ClientSurvey.tsx` with editable templates stored in the database, manageable from a new admin page.

## What's hardcoded today (lines 10–78 of `ClientSurvey.tsx`)

- `PERSONALITY_TRAITS` — 22 trait words
- `getValuesSpectrum(client)` — 6 spectrum questions per entity type (Business / Organization), with `${client.name}` interpolated into the question text
- `PERCEPTION_TRAITS` — 5 archetype words
- `AESTHETIC_CHOICES` — 5 categories (palette, material, house, vehicle, dress) with images / colors

All of this becomes data, edited from `/admin/templates`.

## 1. Schema: `survey_templates` table

One row per entity type. Single JSON column keeps it simple and lets us add new sections later without migrations.

```sql
create table public.survey_templates (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null unique,        -- 'Business' | 'Organization'
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
alter table public.survey_templates enable row level security;
create policy "Anyone can read templates" on public.survey_templates
  for select to anon, authenticated using (true);
create policy "Authenticated can update templates" on public.survey_templates
  for update to authenticated using (true) with check (true);
create policy "Authenticated can insert templates" on public.survey_templates
  for insert to authenticated with check (true);
```

`content` shape:
```json
{
  "personalityTraits": ["Carefree", "Daring", ...],
  "perceptionTraits": ["Sincere", ...],
  "valuesSpectrum": [
    { "id": "respect_power", "left": "Respect", "right": "Power",
      "question": "Would {{name}} rather gain respect or power?" }
  ],
  "aesthetics": {
    "palette":  [{ "name": "Neon", "colors": ["#482EF7", ...] }],
    "material": [{ "name": "Metal", "image": "https://..." }],
    "house":    [...], "vehicle": [...], "dress": [...]
  }
}
```

Question text uses `{{name}}` placeholders so client name interpolation stays in code.

The migration also seeds both rows with the existing hardcoded content so nothing changes visually until an admin edits.

## 2. ClientSurvey reads from the template

- On mount, after loading `client`, fetch the matching `survey_templates` row by `entity_type`.
- Replace the imported constants with template fields. Keep a fallback to the seeded content if the fetch fails so the survey is never blank.
- Replace `{{name}}` with `client.name` at render time.
- For Business clients, the aesthetics step continues to be skipped (existing logic in `getValuesSpectrum` / step list is unchanged — it just uses template data now).

## 3. New admin page: `/admin/templates`

A new route `SurveyTemplates.tsx` reachable from the admin nav (replaces the now-obsolete "Internal Preview Link" buttons on client cards — those get removed).

Layout: a tab switcher (Business | Organization) → form with sections that mirror the template shape.

```text
┌── Survey Templates ─────────────────────────────────┐
│ [ Business ] [ Organization ]                       │
│                                                     │
│ ── Values Spectrum ─────────────  [+ Add Question]  │
│ ┌─ left ───┐ ┌─ right ──┐ ┌─ id ──┐                 │
│ │ Respect  │ │ Power    │ │ resp..│  [✕]            │
│ └──────────┘ └──────────┘ └───────┘                 │
│ Question: [ Would {{name}} rather gain respect... ] │
│                                                     │
│ ── Personality Traits ──────────  [+ Add Trait]     │
│ [Carefree] [Daring] [Spirited] ...    each with [✕] │
│                                                     │
│ ── Perception Traits ───────────  [+ Add]           │
│                                                     │
│ ── Aesthetic Choices ───────────                    │
│  Palette  ▸ rows of {name, color1..5}               │
│  Material ▸ rows of {name, image url}               │
│  House / Vehicle / Dress (same shape)               │
│                                                     │
│              [ Cancel ]  [ Save Template ]          │
└─────────────────────────────────────────────────────┘
```

Editing primitives:
- Add / remove / reorder rows for each list.
- Inline text inputs for words, questions, ids.
- Color palette: 5 hex inputs with a small swatch preview.
- Image rows: URL input with a thumbnail preview.
- "Save" writes the whole `content` JSON back via `supabase.from('survey_templates').update(...)`.

A "Preview Survey" button opens the existing `/survey/<some uid>?preview=1` flow in a new tab so admins can view their changes against a real client. (The preview link stays as a debugging aid but is moved off the client cards into this page's header.)

## 4. Cleanup

- Remove the per-card "Internal Preview Link" block from `AdminDashboard.tsx` (added last turn).
- Add a "Survey Templates" link to the admin nav.
- Add `/admin/templates` route in `App.tsx` guarded by `isAdmin`.

## Files

- New migration creating `survey_templates` and seeding 2 rows.
- `src/pages/SurveyTemplates.tsx` — new admin editor page.
- `src/pages/ClientSurvey.tsx` — fetch template, drop hardcoded constants, interpolate `{{name}}`.
- `src/pages/AdminDashboard.tsx` — remove preview link block, add templates nav link.
- `src/App.tsx` — register `/admin/templates` route.

## Out of scope (can do later)

- Versioning / history of template edits.
- Per-client template overrides.
- Editing the AI system prompt from the UI (currently in `generate-blueprint/index.ts`).
