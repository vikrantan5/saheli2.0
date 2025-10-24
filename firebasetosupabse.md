# Firebase to Supabase Data Migration Guide

## Overview

This guide helps you migrate existing user data from Firebase Firestore to Supabase PostgreSQL.

## ⚠️ Important Notes

1. **Passwords CANNOT be migrated** from Firebase (they're encrypted)
   - Users will need to reset their passwords after migration
   - Consider sending password reset emails to all users

2. **This is a ONE-WAY migration**
   - Test thoroughly before running on production data
   - Keep Firebase running during transition period

3. **Use Supabase SERVICE_ROLE key** (not ANON key)
   - Service role has admin privileges needed for migration
   - Never expose SERVICE_ROLE key in client-side code

---

## Migration Steps

### Step 1: Export Firebase Data

You can export Firebase data manually or programmatically:

#### Manual Export:
1. Go to Firebase Console → Firestore Database
2. Click on **"Export"** button
3. Export to Cloud Storage
4. Download the exported data

#### Programmatic Export:
Use Firebase Admin SDK to export users and Firestore data. Sample code:

```javascript
// Install: npm install firebase-admin
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

// Export all users
async function exportUsers() {
  const users = [];
  let nextPageToken;
  
  do {
    const listUsersResult = await auth.listUsers(1000, nextPageToken);
    users.push(...listUsersResult.users);
    nextPageToken = listUsersResult.pageToken;
  } while (nextPageToken);
  
  return users;
}

// Export user data from Firestore
async function exportUserData(uid) {
  const userDoc = await db.collection('users').doc(uid).get();
  return userDoc.exists ? userDoc.data() : null;
}
```

### Step 2: Transform Data

Transform Firebase data to match Supabase schema:

```javascript
function transformUser(firebaseUser, firestoreData) {
  return {
    // For Supabase Auth
    auth: {
      email: firebaseUser.email,
      email_confirmed: firebaseUser.emailVerified
    },
    // For users table
    profile: {
      email: firebaseUser.email,
      name: firestoreData.name,
      address: firestoreData.address || null,
      occupation: firestoreData.occupation || null,
      created_at: firebaseUser.metadata.creationTime
    },
    // For emergency_contacts table
    contacts: firestoreData.emergencyContacts.map(contact => ({
      name: contact.name,
      phone: contact.phone
    }))
  };
}
```

### Step 3: Import to Supabase

Use Supabase Admin API to create users:

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_SERVICE_ROLE_KEY', // Use SERVICE_ROLE key!
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function importUser(transformedData) {
  // 1. Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: transformedData.auth.email,
    email_confirm: true, // Auto-confirm email
    user_metadata: {
      migratedFromFirebase: true
    }
  });
  
  if (authError) throw authError;
  
  const userId = authData.user.id;
  
  // 2. Insert user profile
  const { error: profileError } = await supabase
    .from('users')
    .insert([{
      id: userId,
      ...transformedData.profile
    }]);
  
  if (profileError) throw profileError;
  
  // 3. Insert emergency contacts
  const contactsWithUserId = transformedData.contacts.map(contact => ({
    user_id: userId,
    ...contact
  }));
  
  const { error: contactsError } = await supabase
    .from('emergency_contacts')
    .insert(contactsWithUserId);
  
  if (contactsError) throw contactsError;
  
  return userId;
}
```

### Step 4: Run Migration

```javascript
async function runMigration() {
  console.log('Starting migration...');
  
  // 1. Export from Firebase
  const firebaseUsers = await exportUsers();
  console.log(`Found ${firebaseUsers.length} users to migrate`);
  
  // 2. Process each user
  let successCount = 0;
  let errorCount = 0;
  
  for (const firebaseUser of firebaseUsers) {
    try {
      const firestoreData = await exportUserData(firebaseUser.uid);
      const transformedData = transformUser(firebaseUser, firestoreData);
      await importUser(transformedData);
      
      console.log(`✅ Migrated: ${firebaseUser.email}`);
      successCount++;
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Error migrating ${firebaseUser.email}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\nMigration complete!`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
}

runMigration();
```

---

## Post-Migration Steps

1. **Notify Users About Password Reset**
   ```
   Subject: Important: Reset Your Saheli App Password
   
   Dear User,
   
   We've upgraded our security systems! As part of this upgrade, 
   you'll need to reset your password.
   
   Click here to reset: [link to password reset]
   
   Thank you,
   Saheli Team
   ```

2. **Keep Firebase Running** for 30 days
   - Some users may not check emails immediately
   - Gives time for gradual transition

3. **Monitor Supabase Dashboard**
   - Check user registrations
   - Monitor error logs
   - Verify SOS features work

4. **After 30 Days**
   - Verify all active users migrated
   - Shut down Firebase
   - Remove Firebase dependencies from app

---

## Troubleshooting

### "User already exists"
- Skip this user (already migrated)
- Or delete from Supabase and re-import

### "Invalid email"
- Firebase user has no email
- Handle manually or skip

### "RLS policy violation"
- SERVICE_ROLE key should bypass RLS
- Check if you're using SERVICE_ROLE (not ANON key)

---

## Alternative: Manual Migration for Small User Base

If you have < 50 users:

1. Ask each user to re-register in the new app
2. They can use same email
3. They'll set a new password
4. Manually verify and approve migrations

---

## Summary

The migration process:
1. ✅ Export Firebase Auth users
2. ✅ Export Firestore user data
3. ✅ Transform to Supabase schema
4. ✅ Import to Supabase Auth
5. ✅ Import to Supabase tables
6. ✅ Send password reset emails
7. ✅ Monitor and verify
8. ✅ Decommission Firebase after 30 days

For a complete, ready-to-run migration script, contact the development team.
