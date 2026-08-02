
DROP POLICY IF EXISTS "profile_photos_scoped_insert" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete profile photos" ON storage.objects;

-- INSERT: only image extensions within profiles/ prefix
CREATE POLICY "profile_photos_insert_images_only"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'profile-photos'
  AND (storage.foldername(name))[1] = 'profiles'
  AND lower(storage.extension(name)) IN ('jpg','jpeg','png','gif','webp')
);
