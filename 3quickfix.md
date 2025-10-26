# 🚨 QUICK FIX - Saheli Database Issue

## 📌 The Problem
Users not appearing in `public.users` after signup → Emergency contacts fail with foreign key error

## ✅ The Solution
Run this SQL script in Supabase SQL Editor: `/app/src/app/FIX_TRIGGER_MIGRATION.sql`

## 🏃 Quick Steps

1. **Open Supabase Dashboard** → SQL Editor
2. **Copy & paste** entire `FIX_TRIGGER_MIGRATION.sql` file
3. **Click "Run"**
4. **Verify** you see "✅ TRIGGER MIGRATION COMPLETE!"
5. **Test** by registering a new user in the app

## 🎯 What This Does

Creates an automatic database trigger that:
- Syncs `auth.users` → `public.users` instantly
- Eliminates foreign key constraint errors
- No code changes needed (already done!)

## ✅ Success Signs

After running the script:
- No more "foreign key violation" errors
- Users auto-added to database on signup
- Emergency contacts save successfully
- User automatically logged in

## 📂 Files Created

1. **`/app/src/app/FIX_TRIGGER_MIGRATION.sql`** - Main fix (RUN THIS)
2. **`/app/src/app/ROLLBACK_TRIGGER.sql`** - Undo script (if needed)
3. **`/app/TRIGGER_SETUP_GUIDE.md`** - Full documentation
4. **`/app/src/services/supabaseAuth.js`** - Updated (auto-applied)

## 🔍 Verify It Works

```sql
-- Run this in SQL Editor to confirm trigger exists:
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

Should return: `on_auth_user_created`

## 🆘 Still Having Issues?

Check `/app/TRIGGER_SETUP_GUIDE.md` for:
- Detailed troubleshooting
- Testing procedures  
- Rollback instructions

---

**Ready to fix? Just run the SQL script! 🚀**
