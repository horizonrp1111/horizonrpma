CREATE TABLE public.admin_users (
  discord_id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admin_users TO authenticated;
GRANT ALL ON public.admin_users TO service_role;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
-- Reads happen through server functions with the service role. No public policies.

CREATE UNIQUE INDEX whitelist_applications_discord_unique
  ON public.whitelist_applications (discord_id)
  WHERE discord_id IS NOT NULL;