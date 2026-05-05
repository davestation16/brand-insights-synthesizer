# Tighten survey_templates RLS + verify updated_by

The current `survey_templates` policies use `USING (true) WITH CHECK (true)` for INSERT and UPDATE, so any signed-in user can write to them. Lock writes to admins and require `updated_by = auth.uid()`.

## 1. Roles infrastructure (new)

There's no roles system today — admin status is inferred client-side from the `@station16.com` email. RLS can't trust that, so we add a server-side roles table.

```sql
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can read their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can read all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
```

Auto-grant admin to `@station16.com` accounts (matches the current client-side rule) and backfill existing users:

```sql
CREATE FUNCTION public.handle_new_user_role() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email IS NOT NULL AND lower(NEW.email) LIKE '%@station16.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created_grant_role
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE lower(email) LIKE '%@station16.com'
ON CONFLICT DO NOTHING;
```

## 2. Replace the `survey_templates` write policies

```sql
DROP POLICY "Authenticated can insert templates" ON public.survey_templates;
DROP POLICY "Authenticated can update templates" ON public.survey_templates;

CREATE POLICY "Admins can insert templates" ON public.survey_templates
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND updated_by = auth.uid());

CREATE POLICY "Admins can update templates" ON public.survey_templates
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND updated_by = auth.uid());
```

Result:
- Only users with the `admin` role can insert or update.
- The new/updated row's `updated_by` must equal the caller's `auth.uid()` — clients can't impersonate another admin or leave it null/stale.
- SELECT remains public (the public survey page needs to read templates).

## 3. Client change in `SurveyTemplates.tsx`

The save call must now set `updated_by` to the signed-in user's id. Update the `save()` function:

```ts
const { data: { user } } = await supabase.auth.getUser();
if (!user) { alert("Not signed in"); return; }
const { error } = await supabase
  .from("survey_templates")
  .update({
    content: content as any,
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  })
  .eq("entity_type", activeType);
```

Without this, RLS will reject the update.

## Notes

- The two existing seeded rows have `updated_by = null`; that's fine since RLS only checks the value on writes, not on reads.
- The `clients` and `surveys` tables keep their current "any authenticated user" policies — they're out of scope for this request, but the same `has_role(...)` pattern is now available if you want to lock those down next.
- Linter will still warn about the public-read-true policy on `survey_templates`; that one is intentional (anonymous survey takers must read templates).
