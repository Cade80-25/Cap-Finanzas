
-- 1) Lock down referrals table: remove public access, only service role
DROP POLICY IF EXISTS "Allow public select referrals" ON public.referrals;
DROP POLICY IF EXISTS "Allow public insert referrals" ON public.referrals;

-- 2) Profile photos bucket: remove permissive policies, add scoped ones
DROP POLICY IF EXISTS "Public read access for profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can read profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can update profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can delete profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete profile photos" ON storage.objects;

-- Drop any remaining permissive policies on profile-photos bucket
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND qual LIKE '%profile-photos%' OR with_check LIKE '%profile-photos%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Re-create scoped policies for profile-photos
-- INSERT: only allow uploads within the profiles/ prefix (no listing/control of other folders)
CREATE POLICY "profile_photos_scoped_insert"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'profile-photos'
  AND (storage.foldername(name))[1] = 'profiles'
);

-- No public SELECT policy: bucket is public, so getPublicUrl direct file access still works
-- through the CDN, but anonymous LIST queries against storage.objects are blocked.
-- No UPDATE policy: prevents overwriting other users' files
-- No DELETE policy: prevents deleting other users' files
