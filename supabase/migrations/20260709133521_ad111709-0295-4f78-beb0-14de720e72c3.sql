DROP POLICY IF EXISTS "Anyone can submit a whitelist application" ON public.whitelist_applications;

REVOKE ALL ON public.discord_profiles FROM anon, authenticated;
REVOKE ALL ON public.whitelist_applications FROM anon, authenticated;
REVOKE ALL ON public.admin_users FROM anon, authenticated;

CREATE POLICY "Deny all client access" ON public.discord_profiles
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "Deny all client access" ON public.whitelist_applications
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "Deny all client access" ON public.admin_users
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);