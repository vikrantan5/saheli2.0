# 🛡️ Saheli App - Supabase Migration Guide

## 🎯 Overview

This guide will help you migrate your Saheli women's safety app from Firebase to Supabase. All authentication and data storage will now use Supabase, while SMS/calls (Twilio) and location services remain unchanged.

---

## 🔑 What Changed?

### Before (Firebase):
- ✅ Firebase Authentication (email/password)
- ✅ Firebase Firestore (NoSQL database)
- ✅ Twilio (SMS & Calls)
- ✅ Expo Location (GPS)

### After (Supabase):
- ✅ **Supabase Auth** (email/password) ← NEW
- ✅ **Supabase PostgreSQL** (relational database) ← NEW
- ✅ Twilio (SMS & Calls) ← UNCHANGED
- ✅ Expo Location (GPS) ← UNCHANGED

---

## 📦 Step 1: Create Supabase Project

### 1.1 Sign Up for Supabase
1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with GitHub, Google, or Email
4. Verify your email if required

### 1.2 Create a New Project
1. Once logged in, click **"New Project"**
2. Fill in the details:
   - **Organization**: Create new or select existing
   - **Project Name**: `Saheli` (or your preferred name)
   - **Database Password**: Create a strong password (SAVE THIS!)
   - **Region**: Choose closest to your users (e.g., `ap-south-1` for India)
   - **Pricing Plan**: Start with Free tier
3. Click **"Create new project"**
4. Wait 2-3 minutes for project to initialize

### 1.3 Get Your API Keys
1. Once project is ready, click on **"Settings"** (gear icon in sidebar)
2. Go to **"API"** section
3. You'll see:
   - **Project URL**: `https://xyzcompany.supabase.co`
   - **Project API keys**:
     - `anon public` key (this is safe for client-side use)
4. **Copy these values** - you'll need them soon!

---

## 🛠️ Step 2: Set Up Database Tables

### 2.1 SQL Setup (Recommended - Copy & Paste)
Go to **SQL Editor** in Supabase dashboard and run this:

```sql
-- Create users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  occupation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create emergency_contacts table
CREATE TABLE public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view own profile" 
  ON public.users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.users FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.users FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Create policies for emergency_contacts table
CREATE POLICY "Users can view own emergency contacts" 
  ON public.emergency_contacts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emergency contacts" 
  ON public.emergency_contacts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own emergency contacts" 
  ON public.emergency_contacts FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own emergency contacts" 
  ON public.emergency_contacts FOR DELETE 
  USING (auth.uid() = user_id);
```

---

## 🔐 Step 3: Configure Authentication

### 3.1 Enable Email Authentication
1. Go to **"Authentication"** in sidebar
2. Click **"Providers"**
3. Find **"Email"** provider
4. Make sure it's **enabled** (should be by default)
5. Configure settings:
   - **Enable email confirmations**: OFF (for testing, turn ON for production)

---

## ⚙️ Step 4: Add Supabase Credentials to Your App

### 4.1 Update Configuration File
1. Open `/app/src/config/supabase.js`
2. Replace placeholders on lines 8-9:

```javascript
const SUPABASE_URL = "https://xyzcompany.supabase.co"; // ← Your Project URL
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."; // ← Your Anon Key
```

### 4.2 Where to Find These Values
- Go to Supabase Dashboard → **Settings** → **API**
- Copy:
  - **Project URL** → paste as `SUPABASE_URL`
  - **Project API keys** → `anon` `public` key → paste as `SUPABASE_ANON_KEY`

---

## ✅ Step 5: Test Your Setup

### 5.1 Test Registration
1. Run your app
2. Click **"Register"**
3. Fill in all fields including at least 1 emergency contact
4. Click **"Create Account"**
5. Check Supabase Dashboard:
   - Go to **Authentication** → **Users** (you should see the new user)
   - Go to **Table Editor** → **users** (you should see user profile)
   - Go to **Table Editor** → **emergency_contacts** (you should see contacts)

### 5.2 Test Login
1. Login with the account you just created
2. You should be redirected to home screen

### 5.3 Test SOS Feature
1. Make sure you're logged in
2. Press the **SOS button** (big red circle)
3. Wait for 5-second countdown
4. SOS should activate and send SMS to emergency contacts

**Important**: Remember to configure Twilio for SMS/calls.

---

## 📂 Files Modified in Migration

### New Files Created:
1. `/app/src/config/supabase.js` - Supabase configuration
2. `/app/src/services/supabaseAuth.js` - Authentication service
3. `/app/src/services/supabaseSosService.js` - SOS service with Supabase

### Files Updated:
1. `/app/src/app/login.jsx` - Now uses Supabase auth
2. `/app/src/app/register.jsx` - Now uses Supabase auth
3. `/app/src/app/(tabs)/index.jsx` - Now uses Supabase SOS
4. `/app/package.json` - Added `@supabase/supabase-js`

### Files Unchanged (Kept as Backup):
1. `/app/src/config/firebase.js` - Original Firebase config
2. `/app/src/services/firebaseAuth.js` - Original auth service
3. `/app/src/services/sosService.js` - Original SOS service

**All old Firebase code is commented in the new Supabase files for reference!**

---

## 🔗 Quick Reference

### Where to Insert API Keys:

**File**: `/app/src/config/supabase.js`

```javascript
// Lines 8-9: Replace these two values
const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL"; 
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
```

**Get these from**: 
Supabase Dashboard → Settings → API

---

## 🐛 Troubleshooting

### Error: "Invalid API key"
- Check if you copied the full `anon` key from Supabase dashboard
- Make sure there are no extra spaces

### Error: "relation public.users does not exist"
- You haven't created the database tables
- Go back to Step 2 and run the SQL script

### Error: "Row Level Security policy violation"
- RLS policies might not be set correctly
- Run the policy creation SQL from Step 2

### SOS not working
- Make sure you're logged in
- Make sure you have emergency contacts saved
- Check if Twilio is configured (separate from Supabase)

---

## 📊 Database Schema

```
┌───────────────────┐
│  auth.users       │  (Supabase built-in)
│  - id (uuid)      │
│  - email          │
└────────┬──────────┘
         │ Foreign Key
         │
┌────────┴────────────────────────┐
│  public.users                   │
│  - id (uuid, PK, FK)            │
│  - email, name, address, etc.   │
└────────┬────────────────────────┘
         │ One-to-Many
         │
┌────────┴─────────────────────────────────┐
│  public.emergency_contacts               │
│  - id, user_id, name, phone              │
└──────────────────────────────────────────┘
```

---

## ✅ Checklist

Before going live:

- [ ] Supabase project created
- [ ] Database tables created (`users` and `emergency_contacts`)
- [ ] RLS policies configured
- [ ] Email authentication enabled
- [ ] API keys added to `/app/src/config/supabase.js`
- [ ] App tested: Registration works
- [ ] App tested: Login works
- [ ] App tested: SOS feature works
- [ ] Twilio configured (for SMS/calls)

---

**🎉 Congratulations! Your Saheli app now uses Supabase!**

---

**Last Updated**: January 2025  
**Version**: 2.0.0 (Supabase Migration)
