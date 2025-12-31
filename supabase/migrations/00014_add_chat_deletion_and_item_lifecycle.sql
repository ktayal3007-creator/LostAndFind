-- Add one-sided chat deletion support
ALTER TABLE chat_conversations 
ADD COLUMN deleted_by_user_ids UUID[] DEFAULT '{}';

-- Add item lifecycle fields to lost_items
ALTER TABLE lost_items
ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'concluded')),
ADD COLUMN conclusion_type TEXT CHECK (conclusion_type IN ('item_found', 'item_not_found')),
ADD COLUMN concluded_at TIMESTAMPTZ,
ADD COLUMN concluded_by UUID REFERENCES profiles(id);

-- Add item lifecycle fields to found_items
ALTER TABLE found_items
ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'concluded')),
ADD COLUMN conclusion_type TEXT CHECK (conclusion_type IN ('owner_found', 'owner_not_found')),
ADD COLUMN concluded_at TIMESTAMPTZ,
ADD COLUMN concluded_by UUID REFERENCES profiles(id);

-- Create indexes for performance
CREATE INDEX idx_chat_conversations_deleted_by ON chat_conversations USING GIN (deleted_by_user_ids);
CREATE INDEX idx_lost_items_status ON lost_items(status);
CREATE INDEX idx_found_items_status ON found_items(status);
CREATE INDEX idx_lost_items_user_status ON lost_items(user_id, status);
CREATE INDEX idx_found_items_user_status ON found_items(user_id, status);

-- Update views to include new fields
DROP VIEW IF EXISTS lost_items_with_profile;
CREATE VIEW lost_items_with_profile AS
SELECT 
  li.*,
  p.username,
  p.full_name,
  p.email,
  p.phone
FROM lost_items li
LEFT JOIN profiles p ON li.user_id = p.id;

DROP VIEW IF EXISTS found_items_with_profile;
CREATE VIEW found_items_with_profile AS
SELECT 
  fi.*,
  p.username,
  p.full_name,
  p.email,
  p.phone
FROM found_items fi
LEFT JOIN profiles p ON fi.user_id = p.id;

-- Grant permissions
GRANT SELECT ON lost_items_with_profile TO authenticated;
GRANT SELECT ON found_items_with_profile TO authenticated;

-- Update RLS policies for concluded items
-- Lost items: users can see active items, or their own concluded items
DROP POLICY IF EXISTS "Users can view lost items" ON lost_items;
CREATE POLICY "Users can view lost items" ON lost_items
  FOR SELECT USING (
    status = 'active' OR user_id = auth.uid()
  );

-- Found items: users can see active items, or their own concluded items
DROP POLICY IF EXISTS "Users can view found items" ON found_items;
CREATE POLICY "Users can view found items" ON found_items
  FOR SELECT USING (
    status = 'active' OR user_id = auth.uid()
  );

-- Users can update their own items to conclude them
DROP POLICY IF EXISTS "Users can update their own lost items" ON lost_items;
CREATE POLICY "Users can update their own lost items" ON lost_items
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own found items" ON found_items;
CREATE POLICY "Users can update their own found items" ON found_items
  FOR UPDATE USING (user_id = auth.uid());

-- Chat conversations: users can only see conversations they're part of and haven't deleted
DROP POLICY IF EXISTS "Users can view their chat conversations" ON chat_conversations;
CREATE POLICY "Users can view their chat conversations" ON chat_conversations
  FOR SELECT USING (
    (lost_item_owner_id = auth.uid() OR found_item_reporter_id = auth.uid())
    AND NOT (auth.uid() = ANY(deleted_by_user_ids))
  );

-- Users can update conversations to mark as deleted for themselves
DROP POLICY IF EXISTS "Users can update their chat conversations" ON chat_conversations;
CREATE POLICY "Users can update their chat conversations" ON chat_conversations
  FOR UPDATE USING (
    lost_item_owner_id = auth.uid() OR found_item_reporter_id = auth.uid()
  );