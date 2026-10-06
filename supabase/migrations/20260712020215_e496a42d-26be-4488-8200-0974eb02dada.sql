
-- 1) Drop UPDATE policy on profile-photos storage bucket (no ownership context)
DROP POLICY IF EXISTS "profile_photos_update_safe_images" ON storage.objects;

-- 2) Harden email_send_state policies: target service_role grantee directly
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='email_send_state' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.email_send_state', p.policyname);
  END LOOP;
END $$;

REVOKE ALL ON public.email_send_state FROM anon, authenticated, PUBLIC;
GRANT ALL ON public.email_send_state TO service_role;

ALTER TABLE public.email_send_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_send_state_service_role_all"
ON public.email_send_state
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
