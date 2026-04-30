-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Branding surveys
CREATE TABLE public.branding_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.branding_surveys ENABLE ROW LEVEL SECURITY;

-- Public can view active surveys (so respondents can load the form by id)
CREATE POLICY "Anyone can view active surveys" ON public.branding_surveys
  FOR SELECT USING (status = 'active');

-- Authenticated users can view all surveys (incl. drafts/closed)
CREATE POLICY "Authenticated can view all surveys" ON public.branding_surveys
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can create surveys" ON public.branding_surveys
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated can update surveys" ON public.branding_surveys
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated can delete surveys" ON public.branding_surveys
  FOR DELETE TO authenticated USING (true);

-- Survey responses
CREATE TABLE public.survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.branding_surveys(id) ON DELETE CASCADE,
  respondent_name TEXT NOT NULL,
  respondent_role TEXT,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_survey_responses_survey_id ON public.survey_responses(survey_id);

-- Anyone can submit a response, but only to an active survey
CREATE POLICY "Anyone can submit response to active survey" ON public.survey_responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.branding_surveys s
      WHERE s.id = survey_id AND s.status = 'active'
    )
  );

-- Only authenticated users can read responses
CREATE POLICY "Authenticated can read responses" ON public.survey_responses
  FOR SELECT TO authenticated USING (true);

-- Brand summaries (AI output)
CREATE TABLE public.brand_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.branding_surveys(id) ON DELETE CASCADE,
  summary JSONB NOT NULL,
  response_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.brand_summaries ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_brand_summaries_survey_id ON public.brand_summaries(survey_id);

CREATE POLICY "Authenticated can read summaries" ON public.brand_summaries
  FOR SELECT TO authenticated USING (true);
-- Inserts happen via service-role edge function; no insert policy for users.