-- Migration: Fix ambiguous column reference in get_conversation_messages_for_user
-- This fixes the issue where messages are not visible after sending

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
  v_user_deleted_at TIMESTAMPTZ;
BEGIN
  -- Get user's deletion timestamp for this conversation
  SELECT cud.deleted_at INTO v_user_deleted_at
  FROM chat_user_deletions cud
  WHERE cud.conversation_id = p_conversation_id
    AND cud.user_id = p_user_id;

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
    AND (v_user_deleted_at IS NULL OR m.created_at > v_user_deleted_at)
  ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_conversation_messages_for_user IS
'Gets messages for a conversation, filtered by user deletion timestamp. Fixed ambiguous column reference.';
