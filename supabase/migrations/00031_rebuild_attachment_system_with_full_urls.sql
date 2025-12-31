-- COMPLETE REBUILD OF ATTACHMENT SYSTEM
-- Store FULL public URLs instead of storage paths

-- Step 1: Add new column for full public URL
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS attachment_full_url TEXT;

-- Step 2: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_attachment_url 
ON chat_messages(attachment_url) 
WHERE attachment_url IS NOT NULL;

-- Step 3: Ensure storage bucket is public
UPDATE storage.buckets
SET public = true
WHERE name = 'app-8e6wgm5ndzi9_chat_attachments';

-- Step 4: Drop and recreate storage policies for clarity
DROP POLICY IF EXISTS "Allow public read access to chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view chat attachments in their conversations" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chat attachments" ON storage.objects;

-- Public read access - anyone can view
CREATE POLICY "Public can read chat attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'app-8e6wgm5ndzi9_chat_attachments');

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'app-8e6wgm5ndzi9_chat_attachments'
  AND auth.uid() IS NOT NULL
);

-- Users can delete their own files
CREATE POLICY "Users can delete own chat attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'app-8e6wgm5ndzi9_chat_attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add comment for documentation
COMMENT ON COLUMN chat_messages.attachment_url IS 'Storage path (legacy) - use attachment_full_url for direct access';
COMMENT ON COLUMN chat_messages.attachment_full_url IS 'Full public URL for direct file access - this is what should be used for rendering';
