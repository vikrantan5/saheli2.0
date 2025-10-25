-- SQL Schema for Live Location and Real-time Chat Features

-- Table for storing user live locations
CREATE TABLE IF NOT EXISTS user_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_updated_at ON user_locations(updated_at);

-- Enable Row Level Security
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can update their own location
CREATE POLICY "Users can update own location"
  ON user_locations FOR ALL
  USING (auth.uid() = user_id);

-- Policy: Emergency contacts can view location
CREATE POLICY "Emergency contacts can view location"
  ON user_locations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM emergency_contacts
      WHERE emergency_contacts.user_id = auth.uid()
    )
  );

-- Table for chat rooms
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for chat rooms
CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_at ON chat_rooms(created_at);

-- Enable Row Level Security
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view chat rooms
CREATE POLICY "Anyone can view chat rooms"
  ON chat_rooms FOR SELECT
  USING (true);

-- Table for chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Enable Row Level Security
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view messages
CREATE POLICY "Authenticated users can view messages"
  ON chat_messages FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can send messages
CREATE POLICY "Authenticated users can send messages"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own messages
CREATE POLICY "Users can delete own messages"
  ON chat_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Insert default chat rooms
INSERT INTO chat_rooms (name, description, icon) VALUES
  ('Local Alerts', 'Share real-time safety alerts in your area', 'alert-triangle'),
  ('Help Requests', 'Request or offer help to community members', 'help-circle'),
  ('Safety Tips', 'Share and discuss women safety tips', 'shield')
ON CONFLICT DO NOTHING;

-- Enable Realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE user_locations;
