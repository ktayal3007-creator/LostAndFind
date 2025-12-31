-- Migration: Fix Chat Deletion with Per-User Timestamps
-- Purpose: Implement WhatsApp-like chat deletion behavior
-- - Deletion is local to each user (soft delete)
-- - New messages automatically restore the chat for users who deleted it
-- - Only messages after deletion timestamp are visible
-- - Chat deletion never blocks message delivery

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 1: Create chat_user_deletions table
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS chat_user_deletions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one deletion record per user per conversation (latest wins)
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_chat_user_deletions_conversation ON chat_user_deletions(conversation_id);
CREATE INDEX idx_chat_user_deletions_user ON chat_user_deletions(user_id);
CREATE INDEX idx_chat_user_deletions_lookup ON chat_user_deletions(conversation_id, user_id);

COMMENT ON TABLE chat_user_deletions IS 
'Tracks when each user deleted a chat conversation. Used for soft delete with automatic restoration.';

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 2: Enable RLS on chat_user_deletions
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE chat_user_deletions ENABLE ROW LEVEL SECURITY;

-- Users can view their own deletion records
CREATE POLICY "Users can view their own chat deletions" ON chat_user_deletions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own deletion records
CREATE POLICY "Users can delete their own chats" ON chat_user_deletions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own deletion records (to change deletion timestamp)
CREATE POLICY "Users can update their own chat deletions" ON chat_user_deletions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own deletion records (to restore chat)
CREATE POLICY "Users can remove their own chat deletions" ON chat_user_deletions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 3: Create function to get user's deletion timestamp for a conversation
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_user_chat_deletion_time(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_deleted_at TIMESTAMPTZ;
BEGIN
  SELECT deleted_at INTO v_deleted_at
  FROM chat_user_deletions
  WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id;
  
  RETURN v_deleted_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_user_chat_deletion_time IS
'Returns the timestamp when a user deleted a chat, or NULL if not deleted';

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 4: Update delete_chat_for_user function to use new table
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION delete_chat_for_user(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_can_delete BOOLEAN;
  v_reason TEXT;
BEGIN
  -- Check if user can delete (still validate conclusion requirement)
  SELECT can_delete, reason
  INTO v_can_delete, v_reason
  FROM can_user_delete_chat(p_conversation_id, p_user_id);

  IF NOT v_can_delete THEN
    RETURN QUERY SELECT FALSE, v_reason;
    RETURN;
  END IF;

  -- Insert or update deletion record with current timestamp
  INSERT INTO chat_user_deletions (conversation_id, user_id, deleted_at)
  VALUES (p_conversation_id, p_user_id, NOW())
  ON CONFLICT (conversation_id, user_id)
  DO UPDATE SET 
    deleted_at = NOW(),
    created_at = NOW();

  RETURN QUERY SELECT TRUE, 'Chat deleted successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION delete_chat_for_user IS
'Soft deletes chat for one user using timestamp. Chat will auto-restore on new messages.';

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 5: Update can_user_delete_chat to check new table
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION can_user_delete_chat(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  can_delete BOOLEAN,
  reason TEXT
) AS $$
DECLARE
  v_item_type TEXT;
  v_item_id UUID;
  v_reporter_id UUID;
  v_conclusion_status TEXT;
  v_is_participant BOOLEAN;
BEGIN
  -- Check if user is a participant
  SELECT 
    p_user_id = ANY(participant_ids),
    item_type,
    item_id
  INTO v_is_participant, v_item_type, v_item_id
  FROM chat_conversations
  WHERE id = p_conversation_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Conversation not found'::TEXT;
    RETURN;
  END IF;

  IF NOT v_is_participant THEN
    RETURN QUERY SELECT FALSE, 'You are not a participant in this chat'::TEXT;
    RETURN;
  END IF;

  -- Get item reporter and conclusion status
  IF v_item_type = 'lost' THEN
    SELECT user_id, conclusion_type
    INTO v_reporter_id, v_conclusion_status
    FROM lost_items
    WHERE id = v_item_id;
  ELSIF v_item_type = 'found' THEN
    SELECT user_id, conclusion_type
    INTO v_reporter_id, v_conclusion_status
    FROM found_items
    WHERE id = v_item_id;
  END IF;

  -- If user is the item reporter, they must conclude first
  IF v_reporter_id = p_user_id AND v_conclusion_status IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Please complete conclusion before deleting chat'::TEXT;
    RETURN;
  END IF;

  -- All checks passed (allow re-deletion to update timestamp)
  RETURN QUERY SELECT TRUE, 'Can delete'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION can_user_delete_chat IS
'Validates if a user can delete a chat. Allows re-deletion to update timestamp.';

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 6: Create function to get conversations with deletion info
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_user_conversations_with_deletions(
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  item_id UUID,
  item_type TEXT,
  participant_ids UUID[],
  lost_item_id UUID,
  found_item_id UUID,
  lost_item_owner_id UUID,
  found_item_reporter_id UUID,
  deleted_by_user_ids UUID[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  item_name TEXT,
  item_reporter_id UUID,
  conclusion_status TEXT,
  item_details JSON,
  participants JSON,
  last_message JSON,
  user_deleted_at TIMESTAMPTZ,
  has_new_messages BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    conv.*,
    del.deleted_at as user_deleted_at,
    -- Check if there are messages after deletion
    CASE 
      WHEN del.deleted_at IS NULL THEN TRUE
      ELSE EXISTS (
        SELECT 1 FROM chat_messages m
        WHERE m.conversation_id = conv.id
          AND m.created_at > del.deleted_at
          AND m.is_deleted = FALSE
      )
    END as has_new_messages
  FROM chat_conversations_with_details conv
  LEFT JOIN chat_user_deletions del 
    ON del.conversation_id = conv.id 
    AND del.user_id = p_user_id
  WHERE p_user_id = ANY(conv.participant_ids)
  ORDER BY conv.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_user_conversations_with_deletions IS
'Gets all conversations for a user with deletion info and new message flag';

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 7: Create function to get messages filtered by deletion timestamp
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_conversation_messages_for_user(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  conversation_id UUID,
  sender_id UUID,
  message TEXT,
  created_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN,
  deleted_at TIMESTAMPTZ,
  delivered BOOLEAN,
  delivered_at TIMESTAMPTZ,
  read BOOLEAN,
  read_at TIMESTAMPTZ
) AS $$
DECLARE
  v_deleted_at TIMESTAMPTZ;
BEGIN
  -- Get user's deletion timestamp for this conversation
  SELECT deleted_at INTO v_deleted_at
  FROM chat_user_deletions
  WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id;

  -- Return messages created after deletion (or all if not deleted)
  RETURN QUERY
  SELECT 
    m.id,
    m.conversation_id,
    m.sender_id,
    m.message,
    m.created_at,
    m.edited_at,
    m.is_deleted,
    m.deleted_at,
    m.delivered,
    m.delivered_at,
    m.read,
    m.read_at
  FROM chat_messages m
  WHERE m.conversation_id = p_conversation_id
    AND (v_deleted_at IS NULL OR m.created_at > v_deleted_at)
  ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_conversation_messages_for_user IS
'Gets messages for a conversation, filtered by user deletion timestamp';

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 8: Migrate existing deleted_by_user_ids data to new table
-- ════════════════════════════════════════════════════════════════════════════

-- Migrate existing deletion data
INSERT INTO chat_user_deletions (conversation_id, user_id, deleted_at)
SELECT 
  cc.id as conversation_id,
  unnest(cc.deleted_by_user_ids) as user_id,
  cc.updated_at as deleted_at -- Use conversation's updated_at as best guess
FROM chat_conversations cc
WHERE cc.deleted_by_user_ids IS NOT NULL 
  AND array_length(cc.deleted_by_user_ids, 1) > 0
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 9: Grant permissions
-- ════════════════════════════════════════════════════════════════════════════

GRANT SELECT, INSERT, UPDATE, DELETE ON chat_user_deletions TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_chat_deletion_time TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_conversations_with_deletions TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_messages_for_user TO authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 10: Add helpful comments
-- ════════════════════════════════════════════════════════════════════════════

COMMENT ON COLUMN chat_user_deletions.deleted_at IS 
'Timestamp when user deleted the chat. Messages before this are hidden, after are shown.';

COMMENT ON COLUMN chat_user_deletions.conversation_id IS 
'The conversation that was deleted by the user';

COMMENT ON COLUMN chat_user_deletions.user_id IS 
'The user who deleted the conversation';

-- ════════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ════════════════════════════════════════════════════════════════════════════

-- Summary:
-- ✅ Created chat_user_deletions table for per-user deletion tracking
-- ✅ Updated delete_chat_for_user to use timestamps
-- ✅ Created get_user_conversations_with_deletions to show chats with new messages
-- ✅ Created get_conversation_messages_for_user to filter messages by deletion time
-- ✅ Migrated existing deletion data
-- ✅ Set up proper RLS policies
-- ✅ Granted necessary permissions

-- Behavior:
-- 1. When user deletes chat: Record added to chat_user_deletions with current timestamp
-- 2. When fetching chats: Chats with new messages (after deletion) are shown
-- 3. When fetching messages: Only messages after deletion timestamp are returned
-- 4. When new message arrives: Chat automatically reappears (has_new_messages = true)
-- 5. Old messages remain hidden, only new messages are visible
-- 6. Deletion never blocks message delivery
