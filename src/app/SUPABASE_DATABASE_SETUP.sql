-- ============================================
-- Saheli App - Supabase Database Setup Script
-- ============================================
-- Run this script in Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste & Run
-- ============================================

-- Step 1: Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Drop existing tables if you want a fresh start (CAUTION: This deletes data!)
-- Uncomment these lines only if you want to start fresh
-- DROP TABLE IF EXISTS public.emergency_contacts CASCADE;
-- DROP TABLE IF EXISTS public.users CASCADE;

-- Step 3: Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT,
  occupation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create emergency_contacts table
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON public.emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Step 6: Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Step 7: Drop existing policies (if any) to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.users;

DROP POLICY IF EXISTS "Users can view own contacts" ON public.emergency_contacts;
DROP POLICY IF EXISTS "Users can insert own contacts" ON public.emergency_contacts;
DROP POLICY IF EXISTS "Users can update own contacts" ON public.emergency_contacts;
DROP POLICY IF EXISTS "Users can delete own contacts" ON public.emergency_contacts;

-- Step 8: Create RLS Policies for users table
-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" 
  ON public.users 
  FOR SELECT 
  USING (auth.uid() = id);

-- Allow users to insert their own profile (during registration)
CREATE POLICY "Users can insert own profile" 
  ON public.users 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
  ON public.users 
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to delete their own profile
CREATE POLICY "Users can delete own profile" 
  ON public.users 
  FOR DELETE 
  USING (auth.uid() = id);

-- Step 9: Create RLS Policies for emergency_contacts table
-- Allow users to view their own emergency contacts
CREATE POLICY "Users can view own contacts" 
  ON public.emergency_contacts 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to insert their own emergency contacts
CREATE POLICY "Users can insert own contacts" 
  ON public.emergency_contacts 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own emergency contacts
CREATE POLICY "Users can update own contacts" 
  ON public.emergency_contacts 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own emergency contacts
CREATE POLICY "Users can delete own contacts" 
  ON public.emergency_contacts 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Step 10: Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 11: Create triggers for updated_at
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

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these after setup to verify everything is correct:

-- Check if tables exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check RLS status
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- View all policies
-- SELECT * FROM pg_policies WHERE schemaname = 'public';

-- ============================================
-- SUCCESS! Your database is now ready.
-- ============================================
-- Next steps:
-- 1. Go to Authentication → Settings
-- 2. Disable email confirmation for testing (Enable for production)
-- 3. Test user registration in your app
-- ============================================
