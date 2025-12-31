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

-- Lost Items: Users can view ACTIVE items
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