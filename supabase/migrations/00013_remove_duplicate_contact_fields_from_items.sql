-- Remove duplicate contact fields from lost_items and found_items
-- These fields duplicate data from profiles table and cause inconsistency
-- Username/contact info should always come from profiles table via JOIN

-- Step 1: Drop the duplicate columns from lost_items
ALTER TABLE lost_items
DROP COLUMN IF EXISTS contact_name,
DROP COLUMN IF EXISTS contact_email,
DROP COLUMN IF EXISTS contact_phone;

-- Step 2: Drop the duplicate columns from found_items
ALTER TABLE found_items
DROP COLUMN IF EXISTS contact_name,
DROP COLUMN IF EXISTS contact_email,
DROP COLUMN IF EXISTS contact_phone;

-- Step 3: Create a view for lost items with profile data
CREATE OR REPLACE VIEW lost_items_with_profile AS
SELECT 
  li.*,
  p.username,
  p.full_name,
  p.email,
  p.phone
FROM lost_items li
LEFT JOIN profiles p ON li.user_id = p.id;

-- Step 4: Create a view for found items with profile data
CREATE OR REPLACE VIEW found_items_with_profile AS
SELECT 
  fi.*,
  p.username,
  p.full_name,
  p.email,
  p.phone
FROM found_items fi
LEFT JOIN profiles p ON fi.user_id = p.id;

-- Step 5: Grant permissions on views
GRANT SELECT ON lost_items_with_profile TO authenticated;
GRANT SELECT ON found_items_with_profile TO authenticated;

-- Step 6: Create RLS policies for the views (they inherit from base tables)
-- Views automatically respect RLS policies from the underlying tables

-- Step 7: Add comments for documentation
COMMENT ON VIEW lost_items_with_profile IS 'Lost items joined with user profile data. Username and contact info come from profiles table, ensuring consistency when users update their profile.';
COMMENT ON VIEW found_items_with_profile IS 'Found items joined with user profile data. Username and contact info come from profiles table, ensuring consistency when users update their profile.';

-- Step 8: Create indexes on user_id if they don't exist (for JOIN performance)
CREATE INDEX IF NOT EXISTS idx_lost_items_user_id ON lost_items(user_id);
CREATE INDEX IF NOT EXISTS idx_found_items_user_id ON found_items(user_id);