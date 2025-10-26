// Firebase Authentication Service for Saheli App
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

/**
 * Register new user with Firebase Auth and store profile in Firestore
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Result with success status and user data
 */
export const registerUser = async (userData) => {
  try {
    const { email, password, name, address, occupation, emergencyContacts } = userData;
    
    // Step 1: Create user in Firebase Authentication
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    const userId = user.uid;

    if (!userId) {
      return { success: false, error: 'User creation failed (no UID returned)' };
    }

    // Step 2: Store user profile in Firestore 'users' collection
    await firestore()
      .collection('users')
      .doc(userId)
      .set({
        email,
        name,
        address: address || null,
        occupation: occupation || null,
        created_at: firestore.FieldValue.serverTimestamp(),
        updated_at: firestore.FieldValue.serverTimestamp(),
      });

    // Step 3: Store emergency contacts
    const batch = firestore().batch();
    
    (emergencyContacts || []).forEach((contact) => {
      const contactRef = firestore().collection('emergency_contacts').doc();
      batch.set(contactRef, {
        user_id: userId,
        name: contact.name,
        phone: contact.phone,
        created_at: firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    console.log('✅ User registered successfully:', userId);
    return { success: true, user: user };
  } catch (error) {
    console.error('❌ Registration error:', error);
    
    // Handle specific Firebase errors
    let errorMessage = error.message;
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'This email is already registered';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password should be at least 6 characters';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    }
    
    return { success: false, error: errorMessage };
  }
};

/**
 * Sign in existing user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Result with success status and user data
 */
export const loginUser = async (email, password) => {
  try {
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    console.log('✅ User logged in:', userCredential.user.uid);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('❌ Login error:', error);
    
    let errorMessage = error.message;
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    } else if (error.code === 'auth/user-disabled') {
      errorMessage = 'This account has been disabled';
    }
    
    return { success: false, error: errorMessage };
  }
};

/**
 * Sign out current user
 * @returns {Promise<Object>} Result with success status
 */
export const logoutUser = async () => {
  try {
    await auth().signOut();
    console.log('✅ User logged out successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Logout error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user profile data with emergency contacts
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Result with user data and emergency contacts
 */
export const getUserData = async (userId) => {
  try {
    // Get user profile
    const userDoc = await firestore()
      .collection('users')
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      throw new Error('User profile not found');
    }

    const userData = userDoc.data();

    // Get emergency contacts
    const contactsSnapshot = await firestore()
      .collection('emergency_contacts')
      .where('user_id', '==', userId)
      .get();

    const emergencyContacts = contactsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      success: true,
      data: {
        id: userId,
        ...userData,
        emergencyContacts: emergencyContacts || []
      }
    };
  } catch (error) {
    console.error('❌ Get user data error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get current authenticated user
 * @returns {Object|null} Current user or null if not authenticated
 */
export const getCurrentUser = () => {
  return auth().currentUser;
};

/**
 * Listen to authentication state changes
 * @param {Function} callback - Callback function to handle auth state changes
 * @returns {Function} Unsubscribe function
 */
export const onAuthChange = (callback) => {
  return auth().onAuthStateChanged((user) => {
    callback(user);
  });
};

/**
 * Update user profile information
 * @param {string} userId - User ID
 * @param {Object} updates - Profile fields to update
 * @returns {Promise<Object>} Result with success status
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    // Remove fields that shouldn't be updated
    const { email, created_at, ...allowedUpdates } = updates;
    
    await firestore()
      .collection('users')
      .doc(userId)
      .update({
        ...allowedUpdates,
        updated_at: firestore.FieldValue.serverTimestamp()
      });

    console.log('✅ User profile updated');
    return { success: true };
  } catch (error) {
    console.error('❌ Update profile error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Add emergency contact
 * @param {string} userId - User ID
 * @param {Object} contact - Contact information {name, phone}
 * @returns {Promise<Object>} Result with success status
 */
export const addEmergencyContact = async (userId, contact) => {
  try {
    await firestore()
      .collection('emergency_contacts')
      .add({
        user_id: userId,
        name: contact.name,
        phone: contact.phone,
        created_at: firestore.FieldValue.serverTimestamp()
      });

    console.log('✅ Emergency contact added');
    return { success: true };
  } catch (error) {
    console.error('❌ Add emergency contact error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete emergency contact
 * @param {string} contactId - Contact document ID
 * @returns {Promise<Object>} Result with success status
 */
export const deleteEmergencyContact = async (contactId) => {
  try {
    await firestore()
      .collection('emergency_contacts')
      .doc(contactId)
      .delete();

    console.log('✅ Emergency contact deleted');
    return { success: true };
  } catch (error) {
    console.error('❌ Delete emergency contact error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send password reset email
 * @param {string} email - User email
 * @returns {Promise<Object>} Result with success status
 */
export const resetPassword = async (email) => {
  try {
    await auth().sendPasswordResetEmail(email);
    console.log('✅ Password reset email sent');
    return { success: true };
  } catch (error) {
    console.error('❌ Password reset error:', error);
    
    let errorMessage = error.message;
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    }
    
    return { success: false, error: errorMessage };
  }
};
