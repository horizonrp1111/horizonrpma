CREATE TABLE public.discord_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discord_id text NOT NULL UNIQUE,
  username text NOT NULL,
  global_name text,
  avatar text,
  email text,
  linked_serial text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.discord_profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.discord_profiles TO authenticated;
GRANT ALL ON public.discord_profiles TO service_role;
ALTER TABLE public.discord_profiles ENABLE ROW LEVEL SECURITY;

-- Reads/writes for discord_profiles happen only via server functions using the service role,
-- so no anon/authenticated policies are needed. RLS remains enabled and denies by default.

CREATE TABLE public.whitelist_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_irl text NOT NULL,
  age_irl int NOT NULL,
  name_rp text NOT NULL,
  age_rp int NOT NULL,
  serial text NOT NULL,
  story text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  discord_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.whitelist_applications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whitelist_applications TO authenticated;
GRANT ALL ON public.whitelist_applications TO service_role;
ALTER TABLE public.whitelist_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a whitelist application (public form)
CREATE POLICY "Anyone can submit a whitelist application"
  ON public.whitelist_applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Reads happen via server functions with service role; no direct client reads.

CREATE INDEX whitelist_applications_serial_idx ON public.whitelist_applications (serial);
CREATE INDEX whitelist_applications_discord_id_idx ON public.whitelist_applications (discord_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_discord_profiles_updated_at
  BEFORE UPDATE ON public.discord_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whitelist_applications_updated_at
  BEFORE UPDATE ON public.whitelist_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();