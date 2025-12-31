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