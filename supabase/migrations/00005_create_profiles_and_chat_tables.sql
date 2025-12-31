-- Create user_role enum
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create trigger function to sync new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  -- Insert a profile synced with fields collected at signup
  INSERT INTO profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    CASE WHEN user_count = 0 THEN 'admin'::user_role ELSE 'user'::user_role END
  );
  RETURN NEW;
END;
$$;

-- Create trigger to auto-sync users after email confirmation
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'admin'::user_role
  );
$$;

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Admins have full access to profiles" ON profiles
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid()));

-- Create public_profiles view for shareable info
CREATE VIEW public_profiles AS
  SELECT id, email, role FROM profiles;

-- Create chat_conversations table
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lost_item_id UUID REFERENCES lost_items(id) ON DELETE CASCADE,
  found_item_id UUID REFERENCES found_items(id) ON DELETE CASCADE,
  lost_item_owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  found_item_reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(lost_item_id, found_item_id)
);

-- Create chat_messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read BOOLEAN NOT NULL DEFAULT FALSE
);

-- Enable RLS on chat tables
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Chat conversations policies
CREATE POLICY "Users can view their own conversations" ON chat_conversations
  FOR SELECT TO authenticated
  USING (auth.uid() = lost_item_owner_id OR auth.uid() = found_item_reporter_id);

CREATE POLICY "Users can create conversations" ON chat_conversations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = lost_item_owner_id OR auth.uid() = found_item_reporter_id);

-- Chat messages policies
CREATE POLICY "Users can view messages in their conversations" ON chat_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE id = conversation_id
      AND (lost_item_owner_id = auth.uid() OR found_item_reporter_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations" ON chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE id = conversation_id
      AND (lost_item_owner_id = auth.uid() OR found_item_reporter_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages" ON chat_messages
  FOR UPDATE TO authenticated
  USING (sender_id = auth.uid() OR EXISTS (
    SELECT 1 FROM chat_conversations
    WHERE id = conversation_id
    AND (lost_item_owner_id = auth.uid() OR found_item_reporter_id = auth.uid())
  ));

-- Create indexes for better performance
CREATE INDEX idx_chat_conversations_lost_owner ON chat_conversations(lost_item_owner_id);
CREATE INDEX idx_chat_conversations_found_reporter ON chat_conversations(found_item_reporter_id);
CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);