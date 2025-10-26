# 🔧 Saheli App - Database Trigger Fix Guide

## 📋 Problem Summary

**Issue:** Users weren't being automatically added to `public.users` table after signup, causing foreign key violations when inserting emergency contacts.

**Error Messages:**
- `"insert or update on table 'emergency_contacts' violates foreign key constraint"`
- `"trigger 'on_auth_user_created' for relation 'users' already exists"`

## ✅ Solution

Created a database trigger that automatically creates a user record in `public.users` whenever someone signs up in `auth.users`.

---

## 🚀 Step-by-Step Setup Instructions

### Step 1: Run the Trigger Migration Script

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor** (left sidebar)
3. Click **"New query"**
4. Copy the entire contents of `/app/src/app/FIX_TRIGGER_MIGRATION.sql`
5. Paste it into the SQL Editor
6. Click **"Run"** (or press Ctrl/Cmd + Enter)

**Expected Output:**
```
✅ Trigger "on_auth_user_created" exists and is active
✅ Function "handle_new_auth_user" exists
═══════════════════════════════════════════════════
✅ TRIGGER MIGRATION COMPLETE!
═══════════════════════════════════════════════════
```

### Step 2: Verify the Setup

Run this query in SQL Editor to confirm:

```sql
-- Check if trigger exists
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND event_object_schema = 'auth'
  AND trigger_name = 'on_auth_user_created';
```

**Expected Result:** You should see one row with:
- `trigger_name`: `on_auth_user_created`
- `event_manipulation`: `INSERT`
- `action_timing`: `AFTER`

---

## 🔄 How It Works Now

### Before (Manual - Broken):
```
User signs up 
  ↓
auth.users created ✅
  ↓
App manually inserts to public.users ⚠️ (could fail)
  ↓
App inserts emergency contacts ❌ (fails if above failed)
```

### After (Automatic - Fixed):
```
User signs up
  ↓
auth.users created ✅
  ↓
🔧 TRIGGER automatically creates public.users record ✅
  ↓
App updates profile with name/address/occupation ✅
  ↓
App inserts emergency contacts ✅ (now works!)
```

---

## 🧪 Testing the Fix

### Test 1: Register a New User

1. **Run your app**
2. **Go to registration screen**
3. **Fill in all fields:**
   - Email: `test@example.com`
   - Password: `Test123456!`
   - Name: `Test User`
   - Address: `123 Test St`
   - Occupation: `Tester`
   - Add at least 1 emergency contact

4. **Click "Register"**

### Test 2: Verify in Supabase

**Check Authentication:**
1. Go to Supabase Dashboard → **Authentication** → **Users**
2. You should see the new user with email `test@example.com`

**Check Users Table:**
1. Go to **Table Editor** → **users**
2. You should see a record with:
   - Same `id` as auth user
   - Email: `test@example.com`
   - Name: `Test User`
   - Address and occupation filled in

**Check Emergency Contacts:**
1. Go to **Table Editor** → **emergency_contacts**
2. You should see the emergency contact(s) linked to the user

**Check Logs (Optional):**
1. Go to **Logs** → **Database**
2. Look for: `Auto-created user in public.users: <user-id>`

---

## 📊 What Changed in the Code

### Updated File: `/app/src/services/supabaseAuth.js`

**Changes Made:**
- ✅ Added 100ms wait for trigger to complete
- ✅ Changed INSERT to UPDATE for profile data
- ✅ Added fallback INSERT if trigger somehow failed
- ✅ Better error messages
- ✅ Added success logging

**Flow:**
1. `signUp()` → creates auth.users → trigger creates public.users
2. Wait 100ms for trigger
3. `UPDATE` public.users with name, address, occupation
4. `INSERT` emergency contacts (now succeeds because user exists!)

---

## 🐛 Troubleshooting

### Issue: "Trigger already exists" error when running migration

**Solution:** The script handles this! It drops existing triggers first.

If you still get this error:
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_auth_user() CASCADE;
```
Then run the migration script again.

---

### Issue: Emergency contacts still fail to insert

**Possible causes:**

1. **Trigger didn't fire** - Check logs:
   ```sql
   -- View recent logs
   SELECT * FROM postgres_logs 
   ORDER BY timestamp DESC 
   LIMIT 50;
   ```

2. **RLS Policies blocking** - Verify policies:
   ```sql
   SELECT policyname, permissive, roles, cmd
   FROM pg_policies 
   WHERE tablename = 'emergency_contacts';
   ```

3. **User not authenticated** - Make sure user is logged in after signup

---

### Issue: User profile has empty name/address

**Likely cause:** The UPDATE is failing. Check:

1. **RLS policies allow update:**
   ```sql
   -- Check if update policy exists
   SELECT * FROM pg_policies 
   WHERE tablename = 'users' 
   AND cmd = 'UPDATE';
   ```

2. **User is authenticated:** The app should auto-login after signup

---

### Issue: "Row Level Security policy violation"

**Solution:** Make sure all RLS policies are created. Run:

```sql
-- Re-create policies
CREATE POLICY "Users can update own profile" 
  ON public.users 
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

---

## 🔙 Rollback (If Needed)

If something goes wrong and you need to remove the trigger:

1. Open Supabase **SQL Editor**
2. Run the contents of `/app/src/app/ROLLBACK_TRIGGER.sql`
3. Update your app code to use INSERT instead of UPDATE

**Note:** With rollback, you'll be back to manual user creation (the old method).

---

## 📚 Technical Details

### The Trigger Function

```sql
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically insert into public.users when auth.users gets a new record
  INSERT INTO public.users (id, email, name, address, occupation, created_at, updated_at)
  VALUES (NEW.id, NEW.email, '', '', '', NOW(), NOW());
  
  RAISE LOG 'Auto-created user in public.users: %', NEW.id;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error auto-creating user: %', SQLERRM;
    RETURN NEW; -- Don't block auth signup even if this fails
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Key Features:**
- ✅ Runs AFTER user is created in auth.users
- ✅ Creates user with same ID and email
- ✅ Logs success/errors for debugging
- ✅ Doesn't block signup even if it fails (failsafe)
- ✅ SECURITY DEFINER allows it to bypass RLS

### The Trigger

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();
```

---

## ✅ Success Checklist

After running the migration, verify:

- [ ] SQL script ran without errors
- [ ] Trigger exists (check verification query)
- [ ] Function exists (check verification query)
- [ ] Test user registration works
- [ ] User appears in Authentication → Users
- [ ] User appears in Table Editor → users
- [ ] Emergency contacts appear in Table Editor → emergency_contacts
- [ ] User is automatically logged in after signup
- [ ] No foreign key constraint errors in logs

---

## 📞 Support

If you're still experiencing issues:

1. **Check Supabase Logs:**
   - Dashboard → Logs → Database
   - Look for errors related to trigger or function

2. **Check Browser Console:**
   - Look for JavaScript errors during signup

3. **Verify Database State:**
   ```sql
   -- Check if users table exists
   SELECT * FROM information_schema.tables 
   WHERE table_name = 'users' AND table_schema = 'public';
   
   -- Check if emergency_contacts table exists
   SELECT * FROM information_schema.tables 
   WHERE table_name = 'emergency_contacts' AND table_schema = 'public';
   ```

---

## 🎉 Expected Outcome

After implementing this fix:

✅ **User signs up** → Immediately added to both `auth.users` AND `public.users`  
✅ **Profile updated** → Name, address, occupation filled in  
✅ **Emergency contacts added** → No foreign key errors  
✅ **User auto-logged in** → Ready to use the app immediately  

**No more foreign key constraint violations! 🎊**

---

**Last Updated:** January 2025  
**Version:** 2.1.0 (Trigger Fix)
