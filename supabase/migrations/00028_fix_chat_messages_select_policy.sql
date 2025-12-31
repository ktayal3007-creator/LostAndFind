-- Migration: Update SELECT policy to use participant_ids for consistency
-- This ensures all policies use the same participant checking logic

-- Drop the old SELECT policy
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON chat_messages;

-- Create new SELECT policy using participant_ids array
CREATE POLICY "Users can view messages in their conversations"
ON chat_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM chat_conversations
    WHERE chat_conversations.id = chat_messages.conversation_id
      AND auth.uid() = ANY(chat_conversations.participant_ids)
  )
);

COMMENT ON POLICY "Users can view messages in their conversations" ON chat_messages IS
'Allows authenticated users to view messages in conversations where they are participants (using participant_ids array)';
