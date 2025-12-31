CREATE OR REPLACE FUNCTION conclude_item_with_history(
  p_item_id UUID,
  p_item_type TEXT,
  p_conclusion_type TEXT,
  p_user_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  history_type TEXT
) AS $$
DECLARE
  v_history_type history_type_enum;
  v_item_exists BOOLEAN;
  v_item_user_id UUID;
BEGIN
  IF p_item_type NOT IN ('lost', 'found') THEN
    RETURN QUERY SELECT FALSE, 'Invalid item type', NULL::TEXT;
    RETURN;
  END IF;

  IF p_item_type = 'lost' THEN
    SELECT EXISTS(SELECT 1 FROM lost_items WHERE id = p_item_id), user_id
    INTO v_item_exists, v_item_user_id
    FROM lost_items WHERE id = p_item_id;
  ELSE
    SELECT EXISTS(SELECT 1 FROM found_items WHERE id = p_item_id), user_id
    INTO v_item_exists, v_item_user_id
    FROM found_items WHERE id = p_item_id;
  END IF;

  IF NOT v_item_exists THEN
    RETURN QUERY SELECT FALSE, 'Item not found', NULL::TEXT;
    RETURN;
  END IF;

  IF v_item_user_id != p_user_id THEN
    RETURN QUERY SELECT FALSE, 'Only the item reporter can conclude this item', NULL::TEXT;
    RETURN;
  END IF;

  IF (p_item_type = 'found' AND p_conclusion_type = 'owner_found') OR
     (p_item_type = 'lost' AND p_conclusion_type = 'item_found') THEN
    v_history_type := 'MAIN_HISTORY';
  ELSE
    v_history_type := 'USER_HISTORY';
  END IF;

  IF p_item_type = 'lost' THEN
    UPDATE lost_items
    SET 
      conclusion_type = p_conclusion_type,
      status = 'concluded',
      history_type = v_history_type,
      concluded_at = NOW(),
      updated_at = NOW()
    WHERE id = p_item_id;
  ELSE
    UPDATE found_items
    SET 
      conclusion_type = p_conclusion_type,
      status = 'concluded',
      history_type = v_history_type,
      concluded_at = NOW(),
      updated_at = NOW()
    WHERE id = p_item_id;
  END IF;

  RETURN QUERY SELECT 
    TRUE, 
    'Item concluded successfully', 
    v_history_type::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION conclude_item_with_history TO authenticated;