-- Migration: Add attachment support to chat messages
-- Adds fields for file attachments (images, documents, etc.)

-- Add attachment columns to chat_messages table
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_type TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_size INTEGER;

-- Create index for faster queries on messages with attachments
CREATE INDEX IF NOT EXISTS idx_chat_messages_attachment 
ON chat_messages(conversation_id, created_at) 
WHERE attachment_url IS NOT NULL;

-- Add check constraint for attachment_type
ALTER TABLE chat_messages
ADD CONSTRAINT check_attachment_type 
CHECK (
  attachment_type IS NULL 
  OR attachment_type IN ('image', 'document', 'video', 'audio')
);

-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-8e6wgm5ndzi9_chat_attachments', 'app-8e6wgm5ndzi9_chat_attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat attachments bucket
-- Allow authenticated users to upload attachments
CREATE POLICY "Users can upload chat attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'app-8e6wgm5ndzi9_chat_attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view attachments in their conversations
CREATE POLICY "Users can view chat attachments in their conversations"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'app-8e6wgm5ndzi9_chat_attachments'
  AND (
    -- User is the uploader
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- User is a participant in a conversation that has this attachment
    EXISTS (
      SELECT 1
      FROM chat_messages cm
      JOIN chat_conversations cc ON cc.id = cm.conversation_id
      WHERE cm.attachment_url = storage.objects.name
        AND auth.uid() = ANY(cc.participant_ids)
    )
  )
);

-- Allow users to delete their own attachments
CREATE POLICY "Users can delete their own chat attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'app-8e6wgm5ndzi9_chat_attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

COMMENT ON COLUMN chat_messages.attachment_url IS 'Storage path to the attachment file';
COMMENT ON COLUMN chat_messages.attachment_type IS 'Type of attachment: image, document, video, audio';
COMMENT ON COLUMN chat_messages.attachment_name IS 'Original filename of the attachment';
COMMENT ON COLUMN chat_messages.attachment_size IS 'File size in bytes';
