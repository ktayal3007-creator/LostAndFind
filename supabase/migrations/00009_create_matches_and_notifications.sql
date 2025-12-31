-- Create matches table to store AI-powered item matches
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lost_item_id UUID NOT NULL REFERENCES lost_items(id) ON DELETE CASCADE,
  found_item_id UUID NOT NULL REFERENCES found_items(id) ON DELETE CASCADE,
  similarity_score INTEGER NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 100),
  match_reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lost_item_id, found_item_id)
);

-- Create match_notifications table for tracking notifications sent
CREATE TABLE IF NOT EXISTS match_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('email', 'in_app')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  UNIQUE(match_id, user_id, notification_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_matches_lost_item ON matches(lost_item_id);
CREATE INDEX IF NOT EXISTS idx_matches_found_item ON matches(found_item_id);
CREATE INDEX IF NOT EXISTS idx_matches_score ON matches(similarity_score DESC);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_match_notifications_user ON match_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_match_notifications_match ON match_notifications(match_id);

-- Enable RLS
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for matches
-- Users can view matches for their own items
CREATE POLICY "Users can view their own matches" ON matches
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lost_items WHERE lost_items.id = matches.lost_item_id AND lost_items.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM found_items WHERE found_items.id = matches.found_item_id AND found_items.user_id = auth.uid()
    )
  );

-- Users can update match status for their own items
CREATE POLICY "Users can update their own matches" ON matches
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM lost_items WHERE lost_items.id = matches.lost_item_id AND lost_items.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM found_items WHERE found_items.id = matches.found_item_id AND found_items.user_id = auth.uid()
    )
  );

-- RLS Policies for match_notifications
CREATE POLICY "Users can view their own notifications" ON match_notifications
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON match_notifications
  FOR UPDATE
  USING (user_id = auth.uid());

-- Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_matches_timestamp
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_matches_updated_at();