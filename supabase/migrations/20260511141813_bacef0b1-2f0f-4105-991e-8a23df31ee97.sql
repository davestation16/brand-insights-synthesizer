ALTER TABLE public.surveys
  ADD COLUMN IF NOT EXISTS respondent_email text,
  ADD COLUMN IF NOT EXISTS respondent_name text;