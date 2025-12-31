-- Migration: Add function to restore deleted chat (show all messages again)
-- This allows users to undo chat deletion and see all messages

CREATE OR REPLACE FUNCTION restore_deleted_chat_for_user(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
BEGIN
  -- Delete the deletion record to restore all messages
  DELETE FROM chat_user_deletions
  WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id;

  IF FOUND THEN
    RETURN QUERY SELECT TRUE, 'Chat restored successfully. All messages are now visible.'::TEXT;
  ELSE
    RETURN QUERY SELECT FALSE, 'No deletion record found for this chat.'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION restore_deleted_chat_for_user IS
'Restores a deleted chat for a user, making all messages visible again';

GRANT EXECUTE ON FUNCTION restore_deleted_chat_for_user TO authenticated;

-- For immediate testing: Clear all deletion records to show all messages
-- UNCOMMENT THE NEXT LINE IF YOU WANT TO CLEAR ALL DELETIONS FOR TESTING:
-- DELETE FROM chat_user_deletions;
