-- Make chat attachments bucket public for easy access
-- This allows all chat participants to view attachments without signed URLs
UPDATE storage.buckets
SET public = true
WHERE name = 'app-8e6wgm5ndzi9_chat_attachments';

-- Update storage policies to allow public read access
-- Anyone can read files (for chat participants)
DROP POLICY IF EXISTS "Allow public read access to chat attachments" ON storage.objects;
CREATE POLICY "Allow public read access to chat attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'app-8e6wgm5ndzi9_chat_attachments');

-- Keep upload restricted to authenticated users only
DROP POLICY IF EXISTS "Allow authenticated users to upload chat attachments" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload chat attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'app-8e6wgm5ndzi9_chat_attachments'
  AND auth.uid() IS NOT NULL
);

-- Allow users to delete their own attachments
DROP POLICY IF EXISTS "Allow users to delete their own attachments" ON storage.objects;
CREATE POLICY "Allow users to delete their own attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'app-8e6wgm5ndzi9_chat_attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);