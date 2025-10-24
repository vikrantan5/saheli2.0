import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Register new user with Firebase Auth and store data in Firestore
export const registerUser = async (userData) => {
  try {
    const { email, password, name, address, occupation, emergencyContacts } = userData;
    
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Store additional user data in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: email,
      name: name,
      address: address,
      occupation: occupation,
      emergencyContacts: emergencyContacts, // Array of 3 contacts
      createdAt: new Date().toISOString()
    });
    
    return { success: true, user };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: error.message };
  }
};

// Sign in existing user
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
};

// Sign out user
export const logoutUser = async () => {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
};

// Get user data from Firestore
export const getUserData = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() };
    } else {
      return { success: false, error: 'User data not found' };
    }
  } catch (error) {
    console.error('Get user data error:', error);
    return { success: false, error: error.message };
  }
};

// Listen to auth state changes
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};
