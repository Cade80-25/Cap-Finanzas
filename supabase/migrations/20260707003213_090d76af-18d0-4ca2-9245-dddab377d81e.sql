
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname IN (
        'profile_photos_insert_safe_images',
        'profile_photos_update_safe_images'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "profile_photos_insert_safe_images"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'profile-photos'
  AND lower(storage.extension(name)) IN ('jpg','jpeg','png','gif','webp')
  AND (
    (metadata->>'mimetype') IS NULL
    OR lower(metadata->>'mimetype') IN ('image/jpeg','image/png','image/gif','image/webp')
  )
);

CREATE POLICY "profile_photos_update_safe_images"
ON storage.objects
FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'profile-photos')
WITH CHECK (
  bucket_id = 'profile-photos'
  AND lower(storage.extension(name)) IN ('jpg','jpeg','png','gif','webp')
  AND (
    (metadata->>'mimetype') IS NULL
    OR lower(metadata->>'mimetype') IN ('image/jpeg','image/png','image/gif','image/webp')
  )
);
