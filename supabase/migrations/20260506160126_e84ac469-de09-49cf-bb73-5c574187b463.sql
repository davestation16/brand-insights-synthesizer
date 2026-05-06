
CREATE TABLE public.template_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  payload jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.template_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read library"
  ON public.template_library FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert library"
  ON public.template_library FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND created_by = auth.uid());

CREATE POLICY "Admins can delete library"
  ON public.template_library FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.clients
  ADD COLUMN include_aesthetics boolean NOT NULL DEFAULT true;
