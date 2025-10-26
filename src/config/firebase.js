// Firebase Configuration for React Native
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

/**
 * Firebase Configuration
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to Firebase Console: https://console.firebase.google.com
 * 2. Select your project → Project Settings
 * 3. Configure platform-specific files:
 * 
 * For Android:
 * - Download google-services.json
 * - Place in /app/android/app/google-services.json
 * 
 * For iOS:
 * - Download GoogleService-Info.plist
 * - Place in /app/ios/GoogleService-Info.plist
 * 
 * React Native Firebase automatically reads these config files.
 * No need to manually initialize here - it's done natively.
 */

// Export Firebase services for use throughout the app
export { auth, firestore };

// Helper to get current timestamp
export const getTimestamp = () => firestore.Timestamp.now();

// Helper to get server timestamp (for Firestore writes)
export const serverTimestamp = () => firestore.FieldValue.serverTimestamp();
