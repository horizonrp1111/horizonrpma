ALTER TABLE public.staff_applications ADD COLUMN IF NOT EXISTS decline_reason TEXT;
DROP INDEX IF EXISTS staff_applications_one_open_per_user;
UPDATE public.staff_applications SET status = 'pending' WHERE status = 'open';
UPDATE public.staff_applications SET status = 'denied' WHERE status = 'closed';
ALTER TABLE public.staff_applications ALTER COLUMN status SET DEFAULT 'pending';
CREATE UNIQUE INDEX staff_applications_one_pending_per_user
  ON public.staff_applications (user_discord_id) WHERE status = 'pending';