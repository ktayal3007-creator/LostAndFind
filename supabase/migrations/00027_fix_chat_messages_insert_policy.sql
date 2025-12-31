-- Migration: Fix chat messages INSERT policy to use participant_ids
-- This ensures both participants can send messages

-- Drop the old INSERT policy
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON chat_messages;

-- Create new INSERT policy using participant_ids array
CREATE POLICY "Users can send messages in their conversations"
ON chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM chat_conversations
    WHERE chat_conversations.id = chat_messages.conversation_id
      AND auth.uid() = ANY(chat_conversations.participant_ids)
  )
);

COMMENT ON POLICY "Users can send messages in their conversations" ON chat_messages IS
'Allows authenticated users to send messages in conversations where they are participants (using participant_ids array)';
