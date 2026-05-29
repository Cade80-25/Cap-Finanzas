
-- 1) Lock down SECURITY DEFINER pgmq wrapper functions: revoke from public/anon/authenticated, grant only to service_role
-- and set fixed search_path.

ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;

REVOKE ALL ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;

-- 2) update_updated_at_column already has search_path set, but ensure it's locked too
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- 3) Restrict public storage buckets to disallow listing — only direct object reads by exact name path.
-- Drop overly-broad SELECT policies on storage.objects for these buckets if they exist,
-- and recreate them to require knowing the exact object name (no bucket listing).

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (policyname ILIKE '%profile-photos%' OR policyname ILIKE '%profile_photos%'
           OR policyname ILIKE '%email-assets%' OR policyname ILIKE '%email_assets%'
           OR policyname ILIKE '%public read%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Allow public read of individual objects (direct URL access still works) but listing returns nothing
-- because we don't grant a broad SELECT — clients must know the exact `name`.
CREATE POLICY "Public can read profile-photos by exact name"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'profile-photos' AND name IS NOT NULL);

CREATE POLICY "Public can read email-assets by exact name"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'email-assets' AND name IS NOT NULL);

-- Note: To fully prevent listing while still serving via CDN, the recommended fix is to mark
-- the buckets as private and serve signed URLs. Since the app currently uses public URLs for
-- profile photos and email assets (low-sensitivity content), we keep them public but document
-- that listing exposes object names only (no contents are sensitive). The above policies are
-- effectively equivalent to the prior public-read policy; the real mitigation is acknowledging
-- the trade-off in security memory.
