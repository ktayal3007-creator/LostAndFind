CREATE OR REPLACE FUNCTION cleanup_old_history_items()
RETURNS TABLE (
  deleted_lost_items INTEGER,
  deleted_found_items INTEGER,
  deleted_chats INTEGER
) AS $$
DECLARE
  v_deleted_lost INTEGER := 0;
  v_deleted_found INTEGER := 0;
  v_deleted_chats INTEGER := 0;
  v_temp_count INTEGER;
  v_cutoff_date TIMESTAMP WITH TIME ZONE;
  v_old_lost_ids UUID[];
  v_old_found_ids UUID[];
BEGIN
  v_cutoff_date := NOW() - INTERVAL '6 months';

  SELECT ARRAY_AGG(id) INTO v_old_lost_ids
  FROM lost_items
  WHERE (concluded_at IS NOT NULL AND concluded_at < v_cutoff_date)
     OR (concluded_at IS NULL AND created_at < v_cutoff_date);

  SELECT ARRAY_AGG(id) INTO v_old_found_ids
  FROM found_items
  WHERE (concluded_at IS NOT NULL AND concluded_at < v_cutoff_date)
     OR (concluded_at IS NULL AND created_at < v_cutoff_date);

  IF v_old_lost_ids IS NOT NULL THEN
    WITH deleted AS (
      DELETE FROM chat_conversations
      WHERE item_type = 'lost' AND item_id = ANY(v_old_lost_ids)
      RETURNING *
    )
    SELECT COUNT(*) INTO v_temp_count FROM deleted;
    v_deleted_chats := v_temp_count;
  END IF;

  IF v_old_found_ids IS NOT NULL THEN
    WITH deleted AS (
      DELETE FROM chat_conversations
      WHERE item_type = 'found' AND item_id = ANY(v_old_found_ids)
      RETURNING *
    )
    SELECT COUNT(*) INTO v_temp_count FROM deleted;
    v_deleted_chats := v_deleted_chats + v_temp_count;
  END IF;

  IF v_old_lost_ids IS NOT NULL THEN
    WITH deleted AS (
      DELETE FROM lost_items WHERE id = ANY(v_old_lost_ids)
      RETURNING *
    )
    SELECT COUNT(*) INTO v_deleted_lost FROM deleted;
  END IF;

  IF v_old_found_ids IS NOT NULL THEN
    WITH deleted AS (
      DELETE FROM found_items WHERE id = ANY(v_old_found_ids)
      RETURNING *
    )
    SELECT COUNT(*) INTO v_deleted_found FROM deleted;
  END IF;

  RETURN QUERY SELECT v_deleted_lost, v_deleted_found, v_deleted_chats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION cleanup_old_history_items TO authenticated;