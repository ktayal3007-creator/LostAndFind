CREATE OR REPLACE FUNCTION delete_user_history_item(
  p_item_id UUID,
  p_item_type TEXT,
  p_user_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_item_history_type history_type_enum;
  v_item_user_id UUID;
BEGIN
  IF p_item_type NOT IN ('lost', 'found') THEN
    RETURN QUERY SELECT FALSE, 'Invalid item type';
    RETURN;
  END IF;

  IF p_item_type = 'lost' THEN
    SELECT history_type, user_id INTO v_item_history_type, v_item_user_id
    FROM lost_items WHERE id = p_item_id;
  ELSE
    SELECT history_type, user_id INTO v_item_history_type, v_item_user_id
    FROM found_items WHERE id = p_item_id;
  END IF;

  IF v_item_history_type IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Item not found';
    RETURN;
  END IF;

  IF v_item_history_type = 'MAIN_HISTORY' THEN
    RETURN QUERY SELECT FALSE, 'Cannot delete public history items';
    RETURN;
  END IF;

  IF v_item_user_id != p_user_id THEN
    RETURN QUERY SELECT FALSE, 'You can only delete your own history items';
    RETURN;
  END IF;

  IF v_item_history_type != 'USER_HISTORY' THEN
    RETURN QUERY SELECT FALSE, 'Can only delete user history items';
    RETURN;
  END IF;

  DELETE FROM chat_conversations
  WHERE item_type = p_item_type AND item_id = p_item_id;

  IF p_item_type = 'lost' THEN
    DELETE FROM lost_items WHERE id = p_item_id;
  ELSE
    DELETE FROM found_items WHERE id = p_item_id;
  END IF;

  RETURN QUERY SELECT TRUE, 'History item deleted successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION delete_user_history_item TO authenticated;