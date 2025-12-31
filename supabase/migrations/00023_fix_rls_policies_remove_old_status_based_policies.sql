-- Drop old conflicting policies that reference the old 'status' field
DROP POLICY IF EXISTS "Users can view lost items" ON lost_items;
DROP POLICY IF EXISTS "Users can view found items" ON found_items;

-- Drop redundant authenticated-only policies since we have public access
DROP POLICY IF EXISTS "Users can view active lost items" ON lost_items;
DROP POLICY IF EXISTS "Users can view main history lost items" ON lost_items;
DROP POLICY IF EXISTS "Users can view own user history lost items" ON lost_items;

DROP POLICY IF EXISTS "Users can view active found items" ON found_items;
DROP POLICY IF EXISTS "Users can view main history found items" ON found_items;
DROP POLICY IF EXISTS "Users can view own user history found items" ON found_items;

-- The "Allow public read access" policies already exist and allow all reads
-- These are sufficient for our use case:
-- - "Allow public read access to lost_items" (qual: true)
-- - "Allow public read access to found_items" (qual: true)