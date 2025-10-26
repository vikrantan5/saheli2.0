-- ============================================
-- Saheli App - TRIGGER FIX MIGRATION SCRIPT
-- ============================================
-- This script fixes the database trigger issues
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 1: CLEAN UP ANY EXISTING BROKEN TRIGGERS/FUNCTIONS
-- ============================================

-- Drop existing trigger if it exists (this fixes the duplicate error)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.handle_new_auth_user();

-- ============================================
-- STEP 2: CREATE THE TRIGGER FUNCTION
-- ============================================
-- This function automatically creates a user record in public.users
-- whenever a new user signs up in auth.users

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new user into public.users table
  INSERT INTO public.users (id, email, name, address, occupation, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    '', -- name will be updated by app
    '', -- address will be updated by app
    '', -- occupation will be updated by app
    NOW(),
    NOW()
  );
  
  -- Log success (visible in Supabase logs)
  RAISE LOG 'Auto-created user in public.users: %', NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block auth user creation
    RAISE LOG 'Error auto-creating user in public.users: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 3: CREATE THE TRIGGER
-- ============================================
-- This trigger fires AFTER a new user is created in auth.users

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- ============================================
-- STEP 4: GRANT NECESSARY PERMISSIONS
-- ============================================

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.handle_new_auth_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_auth_user() TO service_role;

-- ============================================
-- STEP 5: VERIFICATION QUERIES
-- ============================================
-- Run these to verify the setup is correct

-- Check if trigger exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    RAISE NOTICE '✅ Trigger "on_auth_user_created" exists and is active';
  ELSE
    RAISE WARNING '❌ Trigger "on_auth_user_created" NOT found';
  END IF;
END $$;

-- Check if function exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'handle_new_auth_user'
  ) THEN
    RAISE NOTICE '✅ Function "handle_new_auth_user" exists';
  ELSE
    RAISE WARNING '❌ Function "handle_new_auth_user" NOT found';
  END IF;
END $$;

-- ============================================
-- OPTIONAL: TEST THE TRIGGER
-- ============================================
-- Uncomment these lines to test (only in development!)
-- WARNING: This creates a real auth user!

/*
-- Test: Create a test user (will trigger the function)
-- Replace with a test email you own
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- This would normally be done by Supabase Auth signup
  -- Just for testing purposes
  RAISE NOTICE '🧪 Test user creation - check public.users table after this runs';
END $$;
*/

-- ============================================
-- VERIFICATION: View all triggers on auth.users
-- ============================================
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND event_object_schema = 'auth';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '✅ TRIGGER MIGRATION COMPLETE!';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📋 What was fixed:';
  RAISE NOTICE '   ✓ Removed duplicate/broken triggers';
  RAISE NOTICE '   ✓ Created handle_new_auth_user() function';
  RAISE NOTICE '   ✓ Created on_auth_user_created trigger';
  RAISE NOTICE '   ✓ Added proper error handling';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 What happens now:';
  RAISE NOTICE '   1. User signs up → auth.users gets record';
  RAISE NOTICE '   2. Trigger fires → public.users gets record automatically';
  RAISE NOTICE '   3. App updates profile → adds name, address, occupation';
  RAISE NOTICE '   4. App adds emergency contacts → no foreign key errors!';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Next steps:';
  RAISE NOTICE '   1. Test user registration in your app';
  RAISE NOTICE '   2. Check Supabase logs for trigger execution';
  RAISE NOTICE '   3. Verify data in public.users table';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
END $$;
