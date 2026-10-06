DROP POLICY IF EXISTS profile_photos_insert_images_only ON storage.objects;

CREATE POLICY profile_photos_insert_images_only
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'profile-photos'
  AND (storage.foldername(name))[1] = 'profiles'
  AND lower(storage.extension(name)) = ANY (ARRAY['jpg','jpeg','png','gif','webp'])
  AND (metadata->>'mimetype') = ANY (ARRAY['image/jpeg','image/png','image/gif','image/webp'])
);

UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg','image/png','image/gif','image/webp']
WHERE id = 'profile-photos';