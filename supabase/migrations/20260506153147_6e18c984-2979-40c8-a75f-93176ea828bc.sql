-- Tighten clients RLS: admin-only for all operations
DROP POLICY IF EXISTS "Anyone can read client (for survey page)" ON public.clients;
DROP POLICY IF EXISTS "Authenticated can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated can update clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated can delete clients" ON public.clients;

CREATE POLICY "Admins can read clients" ON public.clients
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert clients" ON public.clients
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update clients" ON public.clients
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete clients" ON public.clients
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Tighten surveys RLS: admin-only
DROP POLICY IF EXISTS "Authenticated can read surveys" ON public.surveys;
DROP POLICY IF EXISTS "Authenticated can update surveys" ON public.surveys;
DROP POLICY IF EXISTS "Authenticated can delete surveys" ON public.surveys;

CREATE POLICY "Admins can read surveys" ON public.surveys
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update surveys" ON public.surveys
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete surveys" ON public.surveys
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Restrict EXECUTE on SECURITY DEFINER helper functions.
-- has_role is called inside RLS policies; policies bypass EXECUTE checks
-- because they run as the table owner, so revoking from anon/authenticated
-- is safe.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;

-- handle_new_user_role only ever runs as a trigger on auth.users.
REVOKE ALL ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
