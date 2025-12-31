-- Migration: Fix Chat Deletion and Conclusion Logic
-- Purpose: Ensure one-sided deletion works properly and conclusion button shows correctly

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 1: Update chat_conversations_with_details view to include reporter info
-- ════════════════════════════════════════════════════════════════════════════

DROP VIEW IF EXISTS chat_conversations_with_details CASCADE;

CREATE OR REPLACE VIEW chat_conversations_with_details AS
SELECT 
  cc.id,
  cc.item_id,
  cc.item_type,
  cc.participant_ids,
  cc.lost_item_id,
  cc.found_item_id,
  cc.lost_item_owner_id,
  cc.found_item_reporter_id,
  cc.deleted_by_user_ids,
  cc.created_at,
  cc.updated_at,
  -- Get item name from appropriate table
  CASE 
    WHEN cc.item_type = 'lost' THEN li.item_name
    WHEN cc.item_type = 'found' THEN fi.item_name
  END as item_name,
  -- Get item reporter user_id (CRITICAL for conclusion button)
  CASE 
    WHEN cc.item_type = 'lost' THEN li.user_id
    WHEN cc.item_type = 'found' THEN fi.user_id
  END as item_reporter_id,
  -- Get conclusion status
  CASE 
    WHEN cc.item_type = 'lost' THEN li.conclusion_type
    WHEN cc.item_type = 'found' THEN fi.conclusion_type
  END as conclusion_status,
  -- Get item details
  CASE 
    WHEN cc.item_type = 'lost' THEN row_to_json(li.*)
    WHEN cc.item_type = 'found' THEN row_to_json(fi.*)
  END as item_details,
  -- Get participant profiles
  (SELECT json_agg(json_build_object(
    'id', p.id,
    'username', p.username,
    'full_name', p.full_name,
    'email', p.email
  ))
  FROM profiles p
  WHERE p.id = ANY(cc.participant_ids)
  ) as participants,
  -- Get last message
  (SELECT json_build_object(
    'id', m.id,
    'message', m.message,
    'sender_id', m.sender_id,
    'created_at', m.created_at,
    'is_deleted', m.is_deleted
  )
  FROM chat_messages m
  WHERE m.conversation_id = cc.id
  ORDER BY m.created_at DESC
  LIMIT 1
  ) as last_message
FROM chat_conversations cc
LEFT JOIN lost_items li ON cc.item_type = 'lost' AND cc.item_id = li.id
LEFT JOIN found_items fi ON cc.item_type = 'found' AND cc.item_id = fi.id;

COMMENT ON VIEW chat_conversations_with_details IS 
'Enhanced view with item_reporter_id and conclusion_status for proper UI logic';

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 2: Ensure RLS policies allow UPDATE for participants
-- ════════════════════════════════════════════════════════════════════════════

-- Drop and recreate update policy to ensure it works
DROP POLICY IF EXISTS "Users can update their own conversations" ON chat_conversations;

CREATE POLICY "Users can update their own conversations" ON chat_conversations
  FOR UPDATE TO authenticated
  USING (auth.uid() = ANY(participant_ids))
  WITH CHECK (auth.uid() = ANY(participant_ids));

COMMENT ON POLICY "Users can update their own conversations" ON chat_conversations IS
'Allows participants to update conversation (e.g., add themselves to deleted_by_user_ids)';

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 3: Create helper function to check if user can delete chat
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
  v_already_deleted BOOLEAN;
BEGIN
  -- Check if user is a participant
  SELECT 
    p_user_id = ANY(participant_ids),
    item_type,
    item_id,
    p_user_id = ANY(COALESCE(deleted_by_user_ids, ARRAY[]::UUID[]))
  INTO v_is_participant, v_item_type, v_item_id, v_already_deleted
  FROM chat_conversations
  WHERE id = p_conversation_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Conversation not found';
    RETURN;
  END IF;

  IF NOT v_is_participant THEN
    RETURN QUERY SELECT FALSE, 'You are not a participant in this chat';
    RETURN;
  END IF;

  IF v_already_deleted THEN
    RETURN QUERY SELECT FALSE, 'Chat already deleted for this user';
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
    RETURN QUERY SELECT FALSE, 'Please complete conclusion before deleting chat';
    RETURN;
  END IF;

  -- All checks passed
  RETURN QUERY SELECT TRUE, 'Can delete';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION can_user_delete_chat IS
'Validates if a user can delete a chat, returns reason if not allowed';

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 4: Create function to safely delete chat for user
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
  v_deleted_by UUID[];
BEGIN
  -- Check if user can delete
  SELECT can_delete, reason
  INTO v_can_delete, v_reason
  FROM can_user_delete_chat(p_conversation_id, p_user_id);

  IF NOT v_can_delete THEN
    RETURN QUERY SELECT FALSE, v_reason;
    RETURN;
  END IF;

  -- Get current deleted_by_user_ids
  SELECT COALESCE(deleted_by_user_ids, ARRAY[]::UUID[])
  INTO v_deleted_by
  FROM chat_conversations
  WHERE id = p_conversation_id;

  -- Add user to deleted_by_user_ids if not already there
  IF NOT (p_user_id = ANY(v_deleted_by)) THEN
    v_deleted_by := array_append(v_deleted_by, p_user_id);
  END IF;

  -- Update conversation
  UPDATE chat_conversations
  SET deleted_by_user_ids = v_deleted_by,
      updated_at = NOW()
  WHERE id = p_conversation_id;

  RETURN QUERY SELECT TRUE, 'Chat deleted successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION delete_chat_for_user IS
'Safely deletes chat for one user without affecting the other participant';

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 5: Grant necessary permissions
-- ════════════════════════════════════════════════════════════════════════════

GRANT SELECT ON chat_conversations_with_details TO authenticated;
GRANT EXECUTE ON FUNCTION can_user_delete_chat TO authenticated;
GRANT EXECUTE ON FUNCTION delete_chat_for_user TO authenticated;
