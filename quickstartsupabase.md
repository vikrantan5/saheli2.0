# 🎯 QUICK START - Supabase Setup for Saheli App

## ⚡ 3-Minute Setup Guide

### 1️⃣ Create Supabase Project (2 mins)
1. Go to: https://supabase.com
2. Sign up / Login
3. Click "New Project"
4. Name: "Saheli"
5. Choose region closest to you
6. Click "Create"
7. Wait 2-3 minutes

### 2️⃣ Create Tables (30 seconds)
1. Go to **SQL Editor**
2. Copy-paste this:

```sql
-- Users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  occupation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Emergency contacts table  
CREATE TABLE public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own contacts" ON public.emergency_contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contacts" ON public.emergency_contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contacts" ON public.emergency_contacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contacts" ON public.emergency_contacts FOR DELETE USING (auth.uid() = user_id);
```

3. Click "Run"

### 3️⃣ Get API Keys (10 seconds)
1. Go to **Settings** → **API**
2. Copy:
   - **Project URL**
   - **anon public** key

### 4️⃣ Add Keys to App (10 seconds)
1. Open: `/app/src/config/supabase.js`
2. Replace lines 8-9:

```javascript
const SUPABASE_URL = "https://yourproject.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

---

## ✅ Done! Test Your App

1. Run the app
2. Register a new user
3. Check Supabase → Authentication → Users (should see new user)
4. Check Table Editor → users (should see profile)
5. Check Table Editor → emergency_contacts (should see contacts)

---

## 📍 Where to Add Supabase URL & Key

**File**: `/app/src/config/supabase.js`

**Lines**: 8-9

```javascript
// Line 8: Your Supabase Project URL
const SUPABASE_URL = "PASTE_HERE"; 

// Line 9: Your Supabase Anon Key
const SUPABASE_ANON_KEY = "PASTE_HERE";
```

**Get from**: Supabase Dashboard → Settings → API

---

## 🔍 Quick Troubleshooting

### Error: "Invalid API key"
→ Check you copied the full anon key (starts with `eyJ...`)

### Error: "relation public.users does not exist"
→ Run the SQL from Step 2 above

### Error: "Row Level Security"
→ Make sure you ran ALL the SQL including policies

### App not loading
→ Check browser console for errors
→ Verify API keys have no extra spaces

---

## 📚 Full Documentation

- **Setup Guide**: `/app/SUPABASE_SETUP_GUIDE.md`
- **Migration Guide**: `/app/FIREBASE_TO_SUPABASE_MIGRATION.md`
- **Summary**: `/app/MIGRATION_SUMMARY.md`
- **Supabase Docs**: https://supabase.com/docs

---

## 🆘 SOS Feature Still Needs Twilio

Don't forget to configure Twilio for SMS/calls!

See: `/app/api-set-up-guide.md`

---

**Ready in 3 minutes! 🚀**
