DROP POLICY "Authenticated can update surveys" ON public.branding_surveys;
DROP POLICY "Authenticated can delete surveys" ON public.branding_surveys;

CREATE POLICY "Creators can update surveys" ON public.branding_surveys
  FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can delete surveys" ON public.branding_surveys
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;