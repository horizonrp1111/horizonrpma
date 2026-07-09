CREATE TABLE public.site_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true,
  staff_requests_open BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_singleton CHECK (id = true)
);
INSERT INTO public.site_settings (id, staff_requests_open) VALUES (true, false);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny all client access" ON public.site_settings AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);