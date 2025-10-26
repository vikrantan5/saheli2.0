# Saheli App - Testing Guide

## 🧪 How to Test the New Features

This guide provides step-by-step instructions to test all implemented and enhanced features.

---

## 🚀 Setup

### 1. Install Dependencies
```bash
cd /app
npm install
```

### 2. Configure Environment
Ensure your Supabase credentials are set in the configuration:
- File: `/app/src/config/supabase.js`
- Required: `SUPABASE_URL` and `SUPABASE_ANON_KEY`

### 3. Database Setup
Run the SQL scripts in Supabase Dashboard → SQL Editor:
1. `/app/src/app/SUPABASE_DATABASE_SETUP.sql` (if not already run)
2. `/app/src/app/SUPABSE_NEW_TABLE.sql` (for chat and location features)

### 4. Start the App
```bash
npm start
```

Choose your testing platform:
- Press `w` for Web browser
- Press `i` for iOS Simulator (requires Mac)
- Press `a` for Android Emulator
- Scan QR code with Expo Go app for physical device

---

## ✅ Feature Testing Scenarios

### Test 1: Community Creation Feature (NEW)

#### Prerequisites:
- User must be logged in

#### Steps:
1. **Login to the app**
   - Navigate to login screen
   - Enter credentials (or register new account)
   - Verify successful login

2. **Navigate to Community Tab**
   - Click on "Community" tab in bottom navigation
   - Verify Community Hub screen loads

3. **Open Create Modal**
   - Look for green "Create" button next to "Active Chat Rooms" header
   - Click "Create" button
   - Verify modal slides up from bottom

4. **Fill Community Details**
   - Enter community name (e.g., "Study Group")
   - Enter description (e.g., "Discussion group for students")
   - Select an icon from the 6 options:
     - Users
     - Message
     - Alert
     - Help
     - Shield
     - Heart

5. **Submit Form**
   - Click "Create" button
   - Wait for success message
   - Verify modal closes

6. **Verify Creation**
   - Check if new community appears in the list
   - Click on the new community
   - Verify chat room opens
   - Try sending a test message

#### Expected Results:
- ✅ Create button is visible when logged in
- ✅ Modal opens with all form fields
- ✅ Icon selection shows visual feedback
- ✅ Validation works (try submitting empty form)
- ✅ Success message appears
- ✅ New community appears in list immediately
- ✅ Can join and chat in new community

#### Test Data IDs:
- Create button: `create-community-button`
- Name input: `community-name-input`
- Description input: `community-description-input`
- Save button: `save-community-button`
- Icon buttons: `icon-users`, `icon-message-circle`, etc.

---

### Test 2: Real-time Chat Functionality

#### Prerequisites:
- At least one chat room exists
- User must be logged in

#### Steps:
1. **Single User Test:**
   - Login to app
   - Join any chat room (e.g., "Local Alerts")
   - Send a message
   - Verify message appears in chat

2. **Multi-User Real-time Test:**
   - Open app on two different devices/browsers
   - Login with different accounts on each
   - Both users join the same chat room
   - User A sends a message
   - Verify User B sees the message instantly (real-time)
   - User B replies
   - Verify User A sees the reply instantly

3. **Anonymous Messaging:**
   - In chat room, toggle "Send as anonymous" checkbox
   - Send a message
   - Verify message shows as "Anonymous" instead of username

4. **Test All Community Types:**
   - Test in "Local Alerts" room
   - Test in "Help Requests" room
   - Test in "Safety Tips" room
   - Test in any custom-created room

#### Expected Results:
- ✅ Messages appear instantly (<1 second)
- ✅ No page refresh needed
- ✅ Messages show correct sender information
- ✅ Anonymous messages hide sender identity
- ✅ Timestamps are accurate
- ✅ Auto-scroll to latest message
- ✅ Works in all chat rooms

#### Test Data IDs:
- Chat room items: `chat-room-0`, `chat-room-1`, etc.
- Message input: `message-input`
- Send button: `send-message-button`
- Anonymous toggle: `anonymous-toggle`
- Back button: `chat-back-button`

---

### Test 3: Emergency Contacts Management

#### Prerequisites:
- User must be logged in

#### Steps:
1. **Navigate to Profile**
   - Login to app
   - Click "Profile" tab in bottom navigation

2. **Open Emergency Contacts**
   - Scroll to "Account Settings" section
   - Click "Emergency Contacts" option
   - Verify modal opens with existing contacts (if any)

3. **Add New Contact**
   - Click "Add Emergency Contact" button (dashed border button)
   - Enter contact name (e.g., "Mom")
   - Enter phone number (e.g., "+1 555-123-4567")
   - Repeat for up to 5 contacts

4. **Edit Contact**
   - Modify any contact's name or phone
   - Verify changes are saved

5. **Delete Contact**
   - Click trash icon on a contact
   - Confirm deletion in alert
   - Verify contact is removed

6. **Save Changes**
   - Click "Save Changes" button
   - Wait for success message
   - Close modal

7. **Verify Persistence**
   - Logout and login again
   - Open Emergency Contacts
   - Verify all contacts are still there

#### Expected Results:
- ✅ Modal opens and shows existing contacts
- ✅ Can add up to 5 contacts
- ✅ Can edit contact details
- ✅ Cannot delete last contact (minimum 1 required)
- ✅ Delete confirmation dialog appears
- ✅ Save button works
- ✅ Success message appears
- ✅ Changes persist after logout/login
- ✅ Contact count updates in profile card

#### Test Data IDs:
- Emergency contacts button: (in profile settings)
- Close button: `emergency-contacts-close-button`
- Add contact: `add-contact-button`
- Name input: `contact-0-name-input`, `contact-1-name-input`, etc.
- Phone input: `contact-0-phone-input`, `contact-1-phone-input`, etc.
- Delete button: `delete-contact-0-button`, etc.
- Save button: `save-contacts-button`

---

### Test 4: Sign Out Functionality

#### Prerequisites:
- User must be logged in

#### Steps:
1. **Navigate to Profile**
   - Login to app
   - Click "Profile" tab

2. **Initiate Sign Out**
   - Scroll to bottom of profile
   - Click "Sign Out" button (red button with LogOut icon)
   - Verify confirmation dialog appears

3. **Confirm Logout**
   - Read the confirmation message
   - Click "Sign Out" in the dialog
   - Wait for logout process

4. **Verify Redirect**
   - Verify redirect to login screen
   - Verify "Logged Out" success message

5. **Verify Session Cleared**
   - Try to navigate to Profile tab (should show login prompt)
   - Try to access Community tab (should work but show login prompt for chat)
   - Close and reopen app
   - Verify user is NOT automatically logged in

6. **Login Again**
   - Enter credentials
   - Login successfully
   - Verify no cached data from previous session
   - Verify fresh user data loads

#### Expected Results:
- ✅ Sign Out button is clearly visible in profile
- ✅ Confirmation dialog appears with warning
- ✅ Can cancel logout
- ✅ Logout processes successfully
- ✅ Success message appears
- ✅ Redirects to login screen
- ✅ Cannot access protected features without login
- ✅ Session is completely cleared
- ✅ No cached session data after logout
- ✅ Can login again without issues

---

## 🐛 Common Issues & Solutions

### Issue 1: "Login Required" when trying to create community
**Solution:** Make sure you're logged in. Check authentication status in Profile tab.

### Issue 2: Chat messages not appearing in real-time
**Solution:** 
- Check internet connection
- Verify Supabase Realtime is enabled for `chat_messages` table
- Run: `ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;`

### Issue 3: Cannot save emergency contacts
**Solution:**
- Check Supabase connection
- Verify RLS policies are enabled
- Ensure user is authenticated

### Issue 4: Sign out doesn't redirect
**Solution:**
- Check if `router.replace('/login')` is working
- Verify login route exists at `/app/src/app/login.jsx`

---

## 📊 Test Results Template

Use this template to document your testing:

```
## Test Session: [Date/Time]
## Tester: [Name]
## Platform: [iOS/Android/Web]

### Community Creation:
- [ ] Create button visible when logged in: PASS/FAIL
- [ ] Modal opens: PASS/FAIL
- [ ] Form validation works: PASS/FAIL
- [ ] Icon selection works: PASS/FAIL
- [ ] Community created successfully: PASS/FAIL
- [ ] List refreshes automatically: PASS/FAIL
- [ ] Can join new community: PASS/FAIL

### Real-time Chat:
- [ ] Messages send successfully: PASS/FAIL
- [ ] Real-time updates work: PASS/FAIL
- [ ] Anonymous messaging works: PASS/FAIL
- [ ] Works in all room types: PASS/FAIL

### Emergency Contacts:
- [ ] Modal opens: PASS/FAIL
- [ ] Can add contacts: PASS/FAIL
- [ ] Can edit contacts: PASS/FAIL
- [ ] Can delete contacts: PASS/FAIL
- [ ] Changes persist: PASS/FAIL

### Sign Out:
- [ ] Sign out button works: PASS/FAIL
- [ ] Confirmation dialog appears: PASS/FAIL
- [ ] Logout successful: PASS/FAIL
- [ ] Redirects to login: PASS/FAIL
- [ ] Session cleared: PASS/FAIL
- [ ] Can login again: PASS/FAIL

### Notes:
[Add any observations or issues found]
```

---

## 🎬 Video Testing

For better verification, consider recording screen while testing:
- iOS: Use Screen Recording (Control Center)
- Android: Use built-in screen recorder
- Web: Use OBS Studio or browser extensions

---

## 📱 Device Testing Recommendations

Test on multiple platforms for best coverage:
1. **Web Browser** (Chrome, Firefox, Safari)
2. **iOS Simulator** (if on Mac)
3. **Android Emulator** (Android Studio)
4. **Physical iOS Device** (via Expo Go)
5. **Physical Android Device** (via Expo Go)

---

## ✨ Success Criteria

The implementation is successful if:
- ✅ All test scenarios pass
- ✅ No errors in console
- ✅ Smooth user experience
- ✅ Real-time features work instantly
- ✅ Data persists correctly
- ✅ Authentication flow is secure
- ✅ App is stable across devices

---

## 📞 Need Help?

If you encounter issues:
1. Check Supabase Dashboard for errors
2. Look at browser/device console logs
3. Verify database tables and RLS policies
4. Check network tab for failed API calls
5. Restart the Expo development server

---

**Happy Testing! 🎉**
