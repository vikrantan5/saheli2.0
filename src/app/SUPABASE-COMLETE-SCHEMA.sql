-- ============================================
-- Saheli App - Complete Supabase Database Schema
-- ============================================
-- Run this script in Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste & Run
-- ============================================

-- Step 1: Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS & AUTHENTICATION TABLES
-- ============================================

-- Users table (profile data)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT,
  occupation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Emergency contacts table
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMMUNITY & CHAT TABLES (NEW FEATURE)
-- ============================================

-- Chat rooms table (Communities)
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages table (Real-time messaging)
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LOCATION TRACKING TABLE (OPTIONAL)
-- ============================================

-- User locations table (for live location sharing)
CREATE TABLE IF NOT EXISTS public.user_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Emergency contacts indexes
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON public.emergency_contacts(user_id);

-- Chat rooms indexes
CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_at ON public.chat_rooms(created_at);

-- Chat messages indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON public.chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

-- User locations indexes
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON public.user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_updated_at ON public.user_locations(updated_at);

-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DROP EXISTING POLICIES (Clean slate)
-- ============================================

-- Users policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.users;

-- Emergency contacts policies
DROP POLICY IF EXISTS "Users can view own contacts" ON public.emergency_contacts;
DROP POLICY IF EXISTS "Users can insert own contacts" ON public.emergency_contacts;
DROP POLICY IF EXISTS "Users can update own contacts" ON public.emergency_contacts;
DROP POLICY IF EXISTS "Users can delete own contacts" ON public.emergency_contacts;

-- Chat rooms policies
DROP POLICY IF EXISTS "Anyone can view chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Authenticated users can view chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Authenticated users can create chat rooms" ON public.chat_rooms;

-- Chat messages policies
DROP POLICY IF EXISTS "Authenticated users can view messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.chat_messages;

-- User locations policies
DROP POLICY IF EXISTS "Users can update own location" ON public.user_locations;
DROP POLICY IF EXISTS "Emergency contacts can view location" ON public.user_locations;

-- ============================================
-- CREATE RLS POLICIES - USERS TABLE
-- ============================================

CREATE POLICY "Users can view own profile" 
  ON public.users 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.users 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.users 
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile" 
  ON public.users 
  FOR DELETE 
  USING (auth.uid() = id);

-- ============================================
-- CREATE RLS POLICIES - EMERGENCY CONTACTS
-- ============================================

CREATE POLICY "Users can view own contacts" 
  ON public.emergency_contacts 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contacts" 
  ON public.emergency_contacts 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts" 
  ON public.emergency_contacts 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts" 
  ON public.emergency_contacts 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- CREATE RLS POLICIES - CHAT ROOMS (NEW)
-- ============================================

-- Anyone can view chat rooms (public communities)
CREATE POLICY "Anyone can view chat rooms"
  ON public.chat_rooms 
  FOR SELECT
  USING (true);

-- Authenticated users can create new chat rooms (communities)
CREATE POLICY "Authenticated users can create chat rooms"
  ON public.chat_rooms 
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Optional: Allow users to update/delete rooms they created
-- Uncomment if you want to add edit/delete functionality later
-- CREATE POLICY "Users can update own chat rooms"
--   ON public.chat_rooms
--   FOR UPDATE
--   USING (auth.uid() = created_by)
--   WITH CHECK (auth.uid() = created_by);

-- ============================================
-- CREATE RLS POLICIES - CHAT MESSAGES (NEW)
-- ============================================

-- Authenticated users can view all messages in public rooms
CREATE POLICY "Authenticated users can view messages"
  ON public.chat_messages 
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Authenticated users can send messages
CREATE POLICY "Authenticated users can send messages"
  ON public.chat_messages 
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages"
  ON public.chat_messages 
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- CREATE RLS POLICIES - USER LOCATIONS
-- ============================================

CREATE POLICY "Users can manage own location"
  ON public.user_locations 
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Emergency contacts can view location"
  ON public.user_locations 
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.emergency_contacts
      WHERE emergency_contacts.user_id = auth.uid()
    )
  );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_emergency_contacts_updated_at ON public.emergency_contacts;
CREATE TRIGGER update_emergency_contacts_updated_at
    BEFORE UPDATE ON public.emergency_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_rooms_updated_at ON public.chat_rooms;
CREATE TRIGGER update_chat_rooms_updated_at
    BEFORE UPDATE ON public.chat_rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

-- Insert default chat rooms (if they don't exist)
INSERT INTO public.chat_rooms (name, description, icon) VALUES
  ('Local Alerts', 'Share real-time safety alerts in your area', 'alert-triangle'),
  ('Help Requests', 'Request or offer help to community members', 'help-circle'),
  ('Safety Tips', 'Share and discuss women safety tips', 'shield')
ON CONFLICT DO NOTHING;

-- ============================================
-- ENABLE REALTIME (CRITICAL FOR LIVE CHAT)
-- ============================================

-- Enable realtime for chat messages (live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Enable realtime for user locations (optional, for live tracking)
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_locations;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these to verify setup:

-- 1. Check all tables exist
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- ORDER BY table_name;

-- 2. Check RLS is enabled
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public';

-- 3. Check all policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies 
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- 4. Check realtime is enabled
-- SELECT schemaname, tablename 
-- FROM pg_publication_tables 
-- WHERE pubname = 'supabase_realtime';

-- 5. Check indexes
-- SELECT tablename, indexname 
-- FROM pg_indexes 
-- WHERE schemaname = 'public'
-- ORDER BY tablename;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Database setup complete!';
  RAISE NOTICE '📋 Tables created: users, emergency_contacts, chat_rooms, chat_messages, user_locations';
  RAISE NOTICE '🔒 Row Level Security enabled on all tables';
  RAISE NOTICE '📡 Realtime enabled for chat_messages and user_locations';
  RAISE NOTICE '🎉 Your Saheli app database is ready!';
END $$;

-- ============================================
-- NEXT STEPS
-- ============================================

-- 1. Go to Authentication → Settings
-- 2. Configure email settings (or disable email confirmation for testing)
-- 3. Test user registration in your app
-- 4. Create a test user and verify database entries
-- 5. Test chat room creation and real-time messaging
-- 6. Test emergency contacts management

-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- If realtime doesn't work:
-- 1. Check Supabase project logs
-- 2. Verify realtime is enabled: Database → Replication
-- 3. Ensure chat_messages table is in publication list
-- 4. Check browser console for WebSocket errors

-- If RLS blocks operations:
-- 1. Check policies with verification query #3 above
-- 2. Verify user is authenticated (check auth.uid())
-- 3. Check Supabase logs for policy violations
-- 4. Test with service_role key (bypasses RLS) to isolate issue

-- ============================================
-- END OF SCHEMA
-- ============================================
