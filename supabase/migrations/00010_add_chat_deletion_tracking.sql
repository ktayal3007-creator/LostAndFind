-- Add chat history deletion tracking
ALTER TABLE chat_conversations 
ADD COLUMN IF NOT EXISTS history_deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS history_deleted_by UUID REFERENCES auth.users(id);

-- Add match_id to link conversations to matches
ALTER TABLE chat_conversations
ADD COLUMN IF NOT EXISTS match_id UUID REFERENCES matches(id) ON DELETE SET NULL;

-- Create index for match_id
CREATE INDEX IF NOT EXISTS idx_chat_conversations_match ON chat_conversations(match_id);

-- Add a flag to messages to track if they were sent after deletion
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS sent_after_deletion BOOLEAN DEFAULT FALSE;