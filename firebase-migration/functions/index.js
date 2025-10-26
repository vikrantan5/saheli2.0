/**
 * Saheli App - Firebase Cloud Functions
 * 
 * These functions handle server-side logic that cannot be done on the client:
 * - Auto-updating timestamps
 * - Data validation
 * - Triggers and automation
 * - Background tasks
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// ============================================
// TIMESTAMP AUTO-UPDATE FUNCTIONS
// ============================================

/**
 * Auto-update 'updated_at' timestamp when user profile is updated
 * Triggers on: users/{userId} document update
 */
exports.updateUserTimestamp = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    try {
      const newData = change.after.data();
      
      // Only update if 'updated_at' hasn't been manually set in this update
      if (!newData.updated_at || newData.updated_at === change.before.data().updated_at) {
        await change.after.ref.update({
          updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Updated timestamp for user: ${context.params.userId}`);
      }
    } catch (error) {
      console.error('Error updating user timestamp:', error);
    }
  });

/**
 * Auto-update 'updated_at' timestamp when emergency contact is updated
 * Triggers on: emergency_contacts/{contactId} document update
 */
exports.updateContactTimestamp = functions.firestore
  .document('emergency_contacts/{contactId}')
  .onUpdate(async (change, context) => {
    try {
      const newData = change.after.data();
      
      if (!newData.updated_at || newData.updated_at === change.before.data().updated_at) {
        await change.after.ref.update({
          updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Updated timestamp for contact: ${context.params.contactId}`);
      }
    } catch (error) {
      console.error('Error updating contact timestamp:', error);
    }
  });

// ============================================
// USER MANAGEMENT FUNCTIONS
// ============================================

/**
 * Clean up user data when authentication account is deleted
 * Triggers on: Firebase Auth user deletion
 */
exports.cleanupUserData = functions.auth.user().onDelete(async (user) => {
  try {
    const userId = user.uid;
    console.log(`Cleaning up data for deleted user: ${userId}`);
    
    // Delete user profile
    await db.collection('users').doc(userId).delete();
    
    // Delete emergency contacts
    const contactsSnapshot = await db.collection('emergency_contacts')
      .where('user_id', '==', userId)
      .get();
    
    const deletePromises = [];
    contactsSnapshot.forEach(doc => {
      deletePromises.push(doc.ref.delete());
    });
    
    // Delete user location
    deletePromises.push(db.collection('user_locations').doc(userId).delete());
    
    // Delete chat messages (optional - you may want to keep for history)
    // Uncomment if you want to delete user's messages on account deletion
    /*
    const messagesSnapshot = await db.collection('chat_messages')
      .where('user_id', '==', userId)
      .get();
    messagesSnapshot.forEach(doc => {
      deletePromises.push(doc.ref.delete());
    });
    */
    
    await Promise.all(deletePromises);
    console.log(`Successfully cleaned up data for user: ${userId}`);
  } catch (error) {
    console.error('Error cleaning up user data:', error);
  }
});

// ============================================
// CHAT MESSAGE ENRICHMENT
// ============================================

/**
 * Enrich chat messages with user information
 * Triggers on: New message created in chat_messages
 * Adds user name and email to message for faster queries
 */
exports.enrichChatMessage = functions.firestore
  .document('chat_messages/{messageId}')
  .onCreate(async (snap, context) => {
    try {
      const messageData = snap.data();
      const userId = messageData.user_id;
      
      // Don't enrich if anonymous
      if (messageData.is_anonymous) {
        await snap.ref.update({
          user_name: 'Anonymous',
          user_email: null
        });
        return;
      }
      
      // Fetch user profile
      const userDoc = await db.collection('users').doc(userId).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        await snap.ref.update({
          user_name: userData.name || 'Unknown User',
          user_email: userData.email || null
        });
        console.log(`Enriched message ${context.params.messageId} with user data`);
      }
    } catch (error) {
      console.error('Error enriching chat message:', error);
    }
  });

// ============================================
// LOCATION TRACKING FUNCTIONS (Optional)
// ============================================

/**
 * Monitor stale location data (optional feature)
 * Can be used to alert if user location hasn't been updated in a while
 * Useful for safety tracking features
 */
exports.checkStaleLocations = functions.pubsub
  .schedule('every 30 minutes')
  .onRun(async (context) => {
    try {
      const thirtyMinutesAgo = admin.firestore.Timestamp.fromDate(
        new Date(Date.now() - 30 * 60 * 1000)
      );
      
      const staleLocations = await db.collection('user_locations')
        .where('updated_at', '<', thirtyMinutesAgo)
        .get();
      
      console.log(`Found ${staleLocations.size} stale location records`);
      
      // Here you could:
      // 1. Send notifications to emergency contacts
      // 2. Mark users as potentially offline
      // 3. Clean up old location data
      // Implementation depends on your requirements
      
      return null;
    } catch (error) {
      console.error('Error checking stale locations:', error);
      return null;
    }
  });

// ============================================
// ANALYTICS & MONITORING (Optional)
// ============================================

/**
 * Track SOS activations for analytics
 * You can call this from the app when SOS is activated
 */
exports.logSOSActivation = functions.https.onCall(async (data, context) => {
  try {
    // Verify user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }
    
    const userId = context.auth.uid;
    const { location, contactsNotified } = data;
    
    // Log SOS activation
    await db.collection('sos_logs').add({
      user_id: userId,
      location: location,
      contacts_notified: contactsNotified || 0,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'activated'
    });
    
    console.log(`SOS activated by user: ${userId}`);
    
    return { success: true, message: 'SOS activation logged' };
  } catch (error) {
    console.error('Error logging SOS activation:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================
// EXPORTS SUMMARY
// ============================================

/*
 * Exported Functions:
 * 
 * 1. updateUserTimestamp - Auto-update user profile timestamp
 * 2. updateContactTimestamp - Auto-update emergency contact timestamp  
 * 3. cleanupUserData - Clean up data when user account deleted
 * 4. enrichChatMessage - Add user info to chat messages
 * 5. checkStaleLocations - Monitor inactive location tracking (scheduled)
 * 6. logSOSActivation - Log SOS activations for analytics (callable)
 * 
 * DEPLOYMENT:
 * 1. cd /app/firebase-migration
 * 2. firebase login
 * 3. firebase init (select your project)
 * 4. cd functions && npm install
 * 5. firebase deploy --only functions
 * 
 * TESTING:
 * Use Firebase Emulator Suite for local testing:
 * firebase emulators:start
 */
