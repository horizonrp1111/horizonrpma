CREATE TABLE public.staff_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_discord_id TEXT NOT NULL,
  experience TEXT NOT NULL,
  why_join TEXT NOT NULL,
  how_help TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX staff_applications_one_open_per_user
  ON public.staff_applications (user_discord_id) WHERE status = 'open';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_applications TO authenticated;
GRANT ALL ON public.staff_applications TO service_role;
ALTER TABLE public.staff_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny all client access" ON public.staff_applications AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE TRIGGER update_staff_applications_updated_at BEFORE UPDATE ON public.staff_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();