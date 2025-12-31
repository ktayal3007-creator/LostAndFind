-- Migration: Refactor chat system to strict source-of-truth architecture
-- This migration simplifies the chat schema to use item_id + item_type
-- and ensures all data is fetched from source tables (profiles, lost_items, found_items)

-- Step 1: Add new columns to chat_conversations
ALTER TABLE chat_conversations
ADD COLUMN IF NOT EXISTS item_id UUID,
ADD COLUMN IF NOT EXISTS item_type TEXT CHECK (item_type IN ('lost', 'found')),
ADD COLUMN IF NOT EXISTS participant_ids UUID[] NOT NULL DEFAULT '{}';

-- Step 2: Migrate existing data to new structure
UPDATE chat_conversations
SET 
  item_id = COALESCE(lost_item_id, found_item_id),
  item_type = CASE 
    WHEN lost_item_id IS NOT NULL THEN 'lost'
    WHEN found_item_id IS NOT NULL THEN 'found'
  END,
  participant_ids = ARRAY[lost_item_owner_id, found_item_reporter_id]
WHERE item_id IS NULL;

-- Step 3: Make item_id and item_type NOT NULL after migration
ALTER TABLE chat_conversations
ALTER COLUMN item_id SET NOT NULL,
ALTER COLUMN item_type SET NOT NULL;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_conversations_item ON chat_conversations(item_id, item_type);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_participants ON chat_conversations USING GIN(participant_ids);

-- Step 5: Drop old unique constraint and create new one
ALTER TABLE chat_conversations DROP CONSTRAINT IF EXISTS chat_conversations_lost_item_id_found_item_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_conversations_unique_item_participants 
ON chat_conversations(item_id, item_type, participant_ids);

-- Step 6: Create view for chat conversations with joined data
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
    'created_at', m.created_at
  )
  FROM chat_messages m
  WHERE m.conversation_id = cc.id
  ORDER BY m.created_at DESC
  LIMIT 1
  ) as last_message
FROM chat_conversations cc
LEFT JOIN lost_items li ON cc.item_type = 'lost' AND cc.item_id = li.id
LEFT JOIN found_items fi ON cc.item_type = 'found' AND cc.item_id = fi.id;

-- Step 7: Update RLS policies to use participant_ids
DROP POLICY IF EXISTS "Users can view their own conversations" ON chat_conversations;
CREATE POLICY "Users can view their own conversations" ON chat_conversations
  FOR SELECT TO authenticated
  USING (
    auth.uid() = ANY(participant_ids) 
    AND (deleted_by_user_ids IS NULL OR NOT (auth.uid() = ANY(deleted_by_user_ids)))
  );

DROP POLICY IF EXISTS "Users can create conversations" ON chat_conversations;
CREATE POLICY "Users can create conversations" ON chat_conversations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = ANY(participant_ids));

DROP POLICY IF EXISTS "Users can update their own conversations" ON chat_conversations;
CREATE POLICY "Users can update their own conversations" ON chat_conversations
  FOR UPDATE TO authenticated
  USING (auth.uid() = ANY(participant_ids))
  WITH CHECK (auth.uid() = ANY(participant_ids));

-- Step 8: Grant permissions on view
GRANT SELECT ON chat_conversations_with_details TO authenticated;

-- Step 9: Create function to get other participant
CREATE OR REPLACE FUNCTION get_other_participant_id(
  conversation_participant_ids UUID[],
  current_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN (
    SELECT unnest(conversation_participant_ids)
    WHERE unnest != current_user_id
    LIMIT 1
  );
END;
$$;

-- Step 10: Add comment explaining the architecture
COMMENT ON TABLE chat_conversations IS 'Chat conversations table - uses item_id + item_type for identification. Usernames and item names MUST be fetched from profiles and items tables respectively.';
COMMENT ON COLUMN chat_conversations.item_id IS 'References either lost_items.id or found_items.id depending on item_type';
COMMENT ON COLUMN chat_conversations.item_type IS 'Type of item: lost or found';
COMMENT ON COLUMN chat_conversations.participant_ids IS 'Array of user IDs participating in this conversation';
COMMENT ON VIEW chat_conversations_with_details IS 'View that joins conversations with profiles and items - use this for fetching chat list data';
