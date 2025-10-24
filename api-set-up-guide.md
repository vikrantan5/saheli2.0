# Saheli SOS System - API Setup Guide

This guide will help you set up Firebase and Twilio API keys for the Saheli women's safety app.

## 🔥 Firebase Setup

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `Saheli` (or your preferred name)
4. Click **Continue**
5. Disable Google Analytics (optional) or configure it
6. Click **Create project**

### Step 2: Get Firebase Configuration
1. Once your project is created, click on the **Web icon** (`</>`) to add Firebase to your web app
2. Register your app with a nickname (e.g., "Saheli Web")
3. Copy the `firebaseConfig` object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "saheli-xxxxx.firebaseapp.com",
  projectId: "saheli-xxxxx",
  storageBucket: "saheli-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

### Step 3: Enable Authentication
1. In Firebase Console, go to **Build** → **Authentication**
2. Click **Get started**
3. Go to **Sign-in method** tab
4. Click on **Email/Password**
5. **Enable** the Email/Password provider
6. Click **Save**

### Step 4: Set up Firestore Database
1. In Firebase Console, go to **Build** → **Firestore Database**
2. Click **Create database**
3. Select **Start in production mode** (or test mode for development)
4. Choose a Cloud Firestore location (closest to your users)
5. Click **Enable**

### Step 5: Configure Firestore Rules (Important for Security)
Go to **Rules** tab in Firestore and add these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - only authenticated users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Step 6: Add Firebase Config to Your App
1. Open `/app/src/config/firebase.js`
2. Replace the placeholder values with your Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

---

## 📱 Twilio Setup (for SMS)

### Step 1: Create Twilio Account
1. Go to [Twilio Sign Up](https://www.twilio.com/try-twilio)
2. Sign up for a free trial account
3. Verify your email and phone number
4. Complete the onboarding steps

### Step 2: Get Twilio Credentials
1. Go to [Twilio Console Dashboard](https://console.twilio.com/)
2. You'll see your **Account SID** and **Auth Token** on the dashboard
3. Copy both values (click on the eye icon to reveal Auth Token)

```
Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Auth Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 3: Get a Twilio Phone Number
1. In Twilio Console, go to **Phone Numbers** → **Manage** → **Buy a number**
2. Or go directly to: https://console.twilio.com/phone-numbers
3. Click **Buy a number**
4. Select your country
5. Check **SMS** capability
6. Click **Search**
7. Choose a number and click **Buy**
8. Confirm the purchase (free trial numbers are free!)
9. Copy your phone number (format: +1234567890)

### Step 4: Verify Emergency Contact Numbers (Trial Account Only)
⚠️ **Important for Trial Accounts:**
- Twilio trial accounts can only send SMS to **verified phone numbers**
- You must verify each emergency contact number before they can receive SMS

To verify numbers:
1. Go to **Phone Numbers** → **Manage** → **Verified Caller IDs**
2. Or go to: https://console.twilio.com/verified-caller-ids
3. Click **Add new Caller ID**
4. Enter the emergency contact phone number (with country code)
5. Twilio will call/SMS that number with a verification code
6. Enter the code to verify
7. Repeat for all 3 emergency contact numbers

**Note:** Once you upgrade to a paid account, you can send SMS to any number without verification.

### Step 5: Add Twilio Config to Your App
1. Open `/app/src/config/twilio.js`
2. Replace the placeholder values:

```javascript
export const TWILIO_CONFIG = {
  accountSid: "AC...your account sid here...",
  authToken: "...your auth token here...",
  phoneNumber: "+1234567890" // Your Twilio phone number
};
```

---

## 🔐 Security Best Practices

### Important Notes:
1. **Never commit API keys to Git**
   - Consider using environment variables for production
   - Add `firebase.js` and `twilio.js` to `.gitignore` if sharing code

2. **Twilio Auth Token**
   - Keep it secret and secure
   - Rotate it periodically from Twilio Console

3. **Firebase Security Rules**
   - Always use production rules in live apps
   - Test your security rules thoroughly

4. **Upgrade from Trial**
   - Twilio trial gives you free credits
   - Upgrade to paid account for full SMS capabilities
   - Firebase has generous free tier

---

## 📝 Summary - Files to Update

After getting your API keys, update these 2 files:

### 1. `/app/src/config/firebase.js`
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",                          // ← Add your API key
  authDomain: "saheli-xxxxx.firebaseapp.com",   // ← Add your auth domain
  projectId: "saheli-xxxxx",                    // ← Add your project ID
  storageBucket: "saheli-xxxxx.appspot.com",    // ← Add your storage bucket
  messagingSenderId: "123456789012",            // ← Add your sender ID
  appId: "1:123456789012:web:abc..."            // ← Add your app ID
};
```

### 2. `/app/src/config/twilio.js`
```javascript
export const TWILIO_CONFIG = {
  accountSid: "ACxxxxxxxx...",      // ← Add your Account SID
  authToken: "xxxxxxxxxx...",       // ← Add your Auth Token
  phoneNumber: "+1234567890"        // ← Add your Twilio phone number
};
```

---

## ✅ Testing Your Setup

### Test Firebase Authentication:
1. Run the app
2. Click **Login** button
3. Go to **Register** and create a test account
4. Check Firebase Console → Authentication to see the new user

### Test Firestore Database:
1. After registration, go to Firebase Console → Firestore Database
2. You should see a `users` collection with your user data

### Test SOS (SMS & Calls):
1. Login to the app
2. Press the **SOS button** on home screen
3. Emergency contacts should receive SMS
4. App will prompt to call each contact

---

## 🆘 Troubleshooting

### Firebase Errors:
- **"Firebase: Error (auth/invalid-api-key)"**: Check your API key in firebase.js
- **"Missing or insufficient permissions"**: Update Firestore security rules
- **"Firebase: Error (auth/network-request-failed)"**: Check internet connection

### Twilio Errors:
- **"Unable to create record: Unverified numbers"**: Verify emergency contact numbers in Twilio Console (trial accounts only)
- **"Invalid credentials"**: Double-check Account SID and Auth Token
- **"Invalid 'From' phone number"**: Ensure you're using a Twilio phone number

---

## 💰 Cost Estimates

### Firebase (Free Tier):
- **Authentication**: 50,000 users/month free
- **Firestore**: 1GB storage, 50K reads, 20K writes per day free
- **More than enough for personal/small-scale use**

### Twilio:
- **Trial**: $15 credit (free)
- **SMS**: ~$0.0075 per SMS (varies by country)
- **Phone calls**: ~$0.013 per minute
- **Example**: 3 SMS per SOS = ~$0.02 per SOS activation

---

## 🚀 Ready to Go!

Once you've completed all steps:
1. ✅ Firebase configured
2. ✅ Firestore enabled
3. ✅ Email/Password auth enabled
4. ✅ Twilio configured
5. ✅ Phone number purchased
6. ✅ Emergency numbers verified (trial only)
7. ✅ Config files updated

Your Saheli SOS system is ready to protect and serve! 🛡️

---

## 📞 Need Help?

- **Firebase Documentation**: https://firebase.google.com/docs
- **Twilio Documentation**: https://www.twilio.com/docs
- **Firebase Support**: https://firebase.google.com/support
- **Twilio Support**: https://support.twilio.com/

---

**Remember**: This is a safety-critical application. Test thoroughly before relying on it in real emergencies. Always keep local emergency services (911, 112, etc.) as your primary emergency response option.
