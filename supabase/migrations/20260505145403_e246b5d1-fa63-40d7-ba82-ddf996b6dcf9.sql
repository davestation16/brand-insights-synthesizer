-- Drop old rebuild tables
DROP TABLE IF EXISTS public.brand_summaries CASCADE;
DROP TABLE IF EXISTS public.survey_responses CASCADE;
DROP TABLE IF EXISTS public.branding_surveys CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('Business','Organization')),
  survey_uid TEXT NOT NULL UNIQUE,
  access_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Public can fetch a client by survey_uid (needed for public survey page)
CREATE POLICY "Anyone can read client (for survey page)"
  ON public.clients FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated can insert clients"
  ON public.clients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update clients"
  ON public.clients FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete clients"
  ON public.clients FOR DELETE
  TO authenticated
  USING (true);

-- Surveys table
CREATE TABLE public.surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  access_code TEXT NOT NULL,
  blueprint TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_surveys_client_id ON public.surveys(client_id);

ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;

-- Only authenticated agency users may read/manage surveys; submissions go through edge function (service role)
CREATE POLICY "Authenticated can read surveys"
  ON public.surveys FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can update surveys"
  ON public.surveys FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete surveys"
  ON public.surveys FOR DELETE
  TO authenticated
  USING (true);
