-- Migration: Implement Public Item History and Automatic Cleanup
-- Purpose: Add history_type tracking, auto-cleanup, and public history visibility

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 1: Create history_type enum and add columns
-- ════════════════════════════════════════════════════════════════════════════

-- Create enum for history types
DO $$ BEGIN
  CREATE TYPE history_type_enum AS ENUM ('ACTIVE', 'USER_HISTORY', 'MAIN_HISTORY');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add history_type column to lost_items (default ACTIVE for existing items)
ALTER TABLE lost_items 
ADD COLUMN IF NOT EXISTS history_type history_type_enum DEFAULT 'ACTIVE';

-- Add history_type column to found_items (default ACTIVE for existing items)
ALTER TABLE found_items 
ADD COLUMN IF NOT EXISTS history_type history_type_enum DEFAULT 'ACTIVE';

-- Update existing concluded items to USER_HISTORY (will be corrected by logic later)
UPDATE lost_items 
SET history_type = 'USER_HISTORY' 
WHERE conclusion_type IS NOT NULL AND history_type = 'ACTIVE';

UPDATE found_items 
SET history_type = 'USER_HISTORY' 
WHERE conclusion_type IS NOT NULL AND history_type = 'ACTIVE';

-- Update "owner_found" items to MAIN_HISTORY (public)
UPDATE lost_items 
SET history_type = 'MAIN_HISTORY' 
WHERE conclusion_type = 'item_found' AND history_type = 'USER_HISTORY';

UPDATE found_items 
SET history_type = 'MAIN_HISTORY' 
WHERE conclusion_type = 'owner_found' AND history_type = 'USER_HISTORY';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lost_items_history_type ON lost_items(history_type);
CREATE INDEX IF NOT EXISTS idx_found_items_history_type ON found_items(history_type);
CREATE INDEX IF NOT EXISTS idx_lost_items_concluded_at ON lost_items(concluded_at) WHERE concluded_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_found_items_concluded_at ON found_items(concluded_at) WHERE concluded_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lost_items_created_at ON lost_items(created_at);
CREATE INDEX IF NOT EXISTS idx_found_items_created_at ON found_items(created_at);

COMMENT ON COLUMN lost_items.history_type IS 'ACTIVE: visible in lost items list | USER_HISTORY: private to reporter | MAIN_HISTORY: public success stories';
COMMENT ON COLUMN found_items.history_type IS 'ACTIVE: visible in found items list | USER_HISTORY: private to reporter | MAIN_HISTORY: public success stories';

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 2: Update RLS Policies for History Visibility
-- ════════════════════════════════════════════════════════════════════════════

-- Lost Items: Allow all authenticated users to view MAIN_HISTORY items
DROP POLICY IF EXISTS "Users can view main history lost items" ON lost_items;
CREATE POLICY "Users can view main history lost items" ON lost_items
  FOR SELECT TO authenticated
  USING (history_type = 'MAIN_HISTORY');

-- Lost Items: Users can only view their own USER_HISTORY items
DROP POLICY IF EXISTS "Users can view own user history lost items" ON lost_items;
CREATE POLICY "Users can view own user history lost items" ON lost_items
  FOR SELECT TO authenticated
  USING (history_type = 'USER_HISTORY' AND user_id = auth.uid());

-- Lost Items: Users can view ACTIVE items (existing policy should handle this)
-- Ensure ACTIVE items are visible to all
DROP POLICY IF EXISTS "Users can view active lost items" ON lost_items;
CREATE POLICY "Users can view active lost items" ON lost_items
  FOR SELECT TO authenticated
  USING (history_type = 'ACTIVE');

-- Found Items: Allow all authenticated users to view MAIN_HISTORY items
DROP POLICY IF EXISTS "Users can view main history found items" ON found_items;
CREATE POLICY "Users can view main history found items" ON found_items
  FOR SELECT TO authenticated
  USING (history_type = 'MAIN_HISTORY');

-- Found Items: Users can only view their own USER_HISTORY items
DROP POLICY IF EXISTS "Users can view own user history found items" ON found_items;
CREATE POLICY "Users can view own user history found items" ON found_items
  FOR SELECT TO authenticated
  USING (history_type = 'USER_HISTORY' AND user_id = auth.uid());

-- Found Items: Users can view ACTIVE items
DROP POLICY IF EXISTS "Users can view active found items" ON found_items;
CREATE POLICY "Users can view active found items" ON found_items
  FOR SELECT TO authenticated
  USING (history_type = 'ACTIVE');

-- Prevent deletion of MAIN_HISTORY items
DROP POLICY IF EXISTS "Prevent deletion of main history lost items" ON lost_items;
CREATE POLICY "Prevent deletion of main history lost items" ON lost_items
  FOR DELETE TO authenticated
  USING (history_type != 'MAIN_HISTORY' AND user_id = auth.uid());

DROP POLICY IF EXISTS "Prevent deletion of main history found items" ON found_items;
CREATE POLICY "Prevent deletion of main history found items" ON found_items
  FOR DELETE TO authenticated
  USING (history_type != 'MAIN_HISTORY' AND user_id = auth.uid());

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 3: Create Function to Handle Item Conclusion with History Logic
-- ════════════════════════════════════════════════════════════════════════════

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
  -- Validate item type
  IF p_item_type NOT IN ('lost', 'found') THEN
    RETURN QUERY SELECT FALSE, 'Invalid item type', NULL::TEXT;
    RETURN;
  END IF;

  -- Check if item exists and get owner
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

  -- Verify user is the item reporter
  IF v_item_user_id != p_user_id THEN
    RETURN QUERY SELECT FALSE, 'Only the item reporter can conclude this item', NULL::TEXT;
    RETURN;
  END IF;

  -- RULE 2: "Owner Found" → MAIN_HISTORY (public)
  -- RULE 3: Other conclusions → USER_HISTORY (private)
  IF (p_item_type = 'found' AND p_conclusion_type = 'owner_found') OR
     (p_item_type = 'lost' AND p_conclusion_type = 'item_found') THEN
    v_history_type := 'MAIN_HISTORY';
  ELSE
    v_history_type := 'USER_HISTORY';
  END IF;

  -- Update the item atomically
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

COMMENT ON FUNCTION conclude_item_with_history IS
'Concludes an item and sets appropriate history_type: MAIN_HISTORY for owner_found/item_found, USER_HISTORY for others';

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 4: Create Function for Auto-Cleanup (6 months old items)
-- ════════════════════════════════════════════════════════════════════════════

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
  -- Calculate cutoff date (6 months ago)
  v_cutoff_date := NOW() - INTERVAL '6 months';

  -- Get IDs of old lost items (both history types and active items older than 6 months)
  SELECT ARRAY_AGG(id) INTO v_old_lost_ids
  FROM lost_items
  WHERE (concluded_at IS NOT NULL AND concluded_at < v_cutoff_date)
     OR (concluded_at IS NULL AND created_at < v_cutoff_date);

  -- Get IDs of old found items (both history types and active items older than 6 months)
  SELECT ARRAY_AGG(id) INTO v_old_found_ids
  FROM found_items
  WHERE (concluded_at IS NOT NULL AND concluded_at < v_cutoff_date)
     OR (concluded_at IS NULL AND created_at < v_cutoff_date);

  -- Delete related chat conversations first (to maintain referential integrity)
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

  -- Delete old lost items
  IF v_old_lost_ids IS NOT NULL THEN
    WITH deleted AS (
      DELETE FROM lost_items WHERE id = ANY(v_old_lost_ids)
      RETURNING *
    )
    SELECT COUNT(*) INTO v_deleted_lost FROM deleted;
  END IF;

  -- Delete old found items
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

COMMENT ON FUNCTION cleanup_old_history_items IS
'CRITICAL: Deletes all items (ACTIVE, USER_HISTORY, MAIN_HISTORY) older than 6 months based on concluded_at or created_at';

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 5: Create Function for Manual User History Deletion
-- ════════════════════════════════════════════════════════════════════════════

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
  -- Validate item type
  IF p_item_type NOT IN ('lost', 'found') THEN
    RETURN QUERY SELECT FALSE, 'Invalid item type';
    RETURN;
  END IF;

  -- Get item details
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

  -- RULE 4 & 7: Cannot delete MAIN_HISTORY items
  IF v_item_history_type = 'MAIN_HISTORY' THEN
    RETURN QUERY SELECT FALSE, 'Cannot delete public history items';
    RETURN;
  END IF;

  -- Verify user owns the item
  IF v_item_user_id != p_user_id THEN
    RETURN QUERY SELECT FALSE, 'You can only delete your own history items';
    RETURN;
  END IF;

  -- Only allow deletion of USER_HISTORY items
  IF v_item_history_type != 'USER_HISTORY' THEN
    RETURN QUERY SELECT FALSE, 'Can only delete user history items';
    RETURN;
  END IF;

  -- Delete related chats first
  DELETE FROM chat_conversations
  WHERE item_type = p_item_type AND item_id = p_item_id;

  -- Delete the item
  IF p_item_type = 'lost' THEN
    DELETE FROM lost_items WHERE id = p_item_id;
  ELSE
    DELETE FROM found_items WHERE id = p_item_id;
  END IF;

  RETURN QUERY SELECT TRUE, 'History item deleted successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION delete_user_history_item IS
'Allows users to manually delete their own USER_HISTORY items only. MAIN_HISTORY items cannot be deleted manually.';

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 6: Grant Permissions
-- ════════════════════════════════════════════════════════════════════════════

GRANT EXECUTE ON FUNCTION conclude_item_with_history TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_history_items TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_history_item TO authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 7: Update Views to Include history_type
-- ════════════════════════════════════════════════════════════════════════════

-- Recreate lost_items_with_profile view
DROP VIEW IF EXISTS lost_items_with_profile CASCADE;
CREATE OR REPLACE VIEW lost_items_with_profile AS
SELECT 
  li.*,
  p.username,
  p.full_name,
  p.email
FROM lost_items li
LEFT JOIN profiles p ON li.user_id = p.id;

GRANT SELECT ON lost_items_with_profile TO authenticated;

-- Recreate found_items_with_profile view
DROP VIEW IF EXISTS found_items_with_profile CASCADE;
CREATE OR REPLACE VIEW found_items_with_profile AS
SELECT 
  fi.*,
  p.username,
  p.full_name,
  p.email
FROM found_items fi
LEFT JOIN profiles p ON fi.user_id = p.id;

GRANT SELECT ON found_items_with_profile TO authenticated;

COMMENT ON VIEW lost_items_with_profile IS 'Lost items with reporter profile information';
COMMENT ON VIEW found_items_with_profile IS 'Found items with reporter profile information';
