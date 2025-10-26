// Firebase Configuration for React Native
// This is a template - Replace with your actual Firebase project credentials

/**
 * HOW TO GET THESE VALUES:
 * 1. Go to Firebase Console: https://console.firebase.google.com
 * 2. Select your project (or create one)
 * 3. Click on Settings (gear icon) → Project Settings
 * 4. Scroll to "Your apps" section
 * 5. Click on Web app icon (</>) or add a new web app
 * 6. Copy the firebaseConfig object values below
 */

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",                           // e.g., "AIzaSyC..."
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",    // e.g., "saheli-app.firebaseapp.com"
  projectId: "YOUR_PROJECT_ID",                     // e.g., "saheli-app"
  storageBucket: "YOUR_PROJECT_ID.appspot.com",     // e.g., "saheli-app.appspot.com"
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",    // e.g., "123456789012"
  appId: "YOUR_APP_ID",                             // e.g., "1:123456789012:web:abcdef"
  
  // Optional: Uncomment if you're using Firebase Analytics
  // measurementId: "G-XXXXXXXXXX"
};

/**
 * SETUP INSTRUCTIONS:
 * 
 * 1. Copy the firebaseConfig values from Firebase Console
 * 2. Paste them in /app/src/config/firebase.js (the actual config file used by the app)
 * 3. For Android: Place google-services.json in /app/android/app/
 * 4. For iOS: Place GoogleService-Info.plist in /app/ios/
 * 5. Rebuild your app: yarn android or yarn ios
 * 
 * NEVER commit actual credentials to version control!
 * Use environment variables in production.
 */

module.exports = firebaseConfig;
