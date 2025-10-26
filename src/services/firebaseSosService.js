// Firebase SOS Service
import * as Location from 'expo-location';
import { Linking, Alert } from 'react-native';
import { TWILIO_CONFIG, TWILIO_SMS_URL } from '../config/twilio';
import { getUserData, getCurrentUser } from './firebaseAuth';

/**
 * Get current GPS location
 * @returns {Promise<Object|null>} Location coordinates or null
 */
export const getCurrentLocation = async () => {
  try {
    // Request location permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required for SOS feature');
      return null;
    }
    
    // Get current position
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High
    });
    
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude
    };
  } catch (error) {
    console.error('❌ Location error:', error);
    Alert.alert('Location Error', 'Unable to get your location');
    return null;
  }
};

/**
 * Send SMS via Twilio
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} message - SMS message text
 * @returns {Promise<Object>} Result with success status
 */
export const sendSOSSMS = async (phoneNumber, message) => {
  try {
    const formData = new URLSearchParams();
    formData.append('To', phoneNumber);
    formData.append('From', TWILIO_CONFIG.phoneNumber);
    formData.append('Body', message);
    
    const response = await fetch(TWILIO_SMS_URL, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${TWILIO_CONFIG.accountSid}:${TWILIO_CONFIG.authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });
    
    if (response.ok) {
      console.log('✅ SMS sent to:', phoneNumber);
      return { success: true };
    } else {
      const error = await response.json();
      console.error('❌ SMS error:', error);
      return { success: false, error: error.message };
    }
  } catch (error) {
    console.error('❌ SMS sending error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Make phone call
 * @param {string} phoneNumber - Phone number to call
 * @returns {Promise<Object>} Result with success status
 */
export const makePhoneCall = async (phoneNumber) => {
  try {
    const phoneUrl = `tel:${phoneNumber}`;
    const canOpen = await Linking.canOpenURL(phoneUrl);
    
    if (canOpen) {
      await Linking.openURL(phoneUrl);
      return { success: true };
    } else {
      return { success: false, error: 'Cannot make phone calls on this device' };
    }
  } catch (error) {
    console.error('❌ Phone call error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Main SOS activation function using Firebase
 * Sends SMS to all emergency contacts and initiates calls
 * @returns {Promise<Object>} Result with success status and details
 */
export const activateSOS = async () => {
  try {
    // Get current user from Firebase Auth
    const currentUser = getCurrentUser();
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to use SOS');
      return { success: false };
    }
    
    // Get user data with emergency contacts from Firestore
    const userDataResult = await getUserData(currentUser.uid);
    if (!userDataResult.success || !userDataResult.data.emergencyContacts) {
      Alert.alert('Error', 'Emergency contacts not found. Please update your profile.');
      return { success: false };
    }
    
    const { emergencyContacts, name } = userDataResult.data;
    
    if (emergencyContacts.length === 0) {
      Alert.alert('Error', 'No emergency contacts added. Please add at least one emergency contact.');
      return { success: false };
    }
    
    // Get current location
    const location = await getCurrentLocation();
    if (!location) {
      return { success: false };
    }
    
    const locationUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    const sosMessage = `🚨 EMERGENCY! ${name} needs help!\n\nLocation: ${locationUrl}\n\nPlease respond immediately. This is an automated SOS from Saheli app.`;
    
    // Send SMS to all emergency contacts
    console.log(`📤 Sending SOS to ${emergencyContacts.length} contacts...`);
    const smsPromises = emergencyContacts.map(contact => 
      sendSOSSMS(contact.phone, sosMessage)
    );
    await Promise.all(smsPromises);
    
    // Call emergency contacts one by one (with delay)
    for (let i = 0; i < emergencyContacts.length; i++) {
      const contact = emergencyContacts[i];
      
      Alert.alert(
        `Calling ${contact.name}`,
        `Calling emergency contact ${i + 1} of ${emergencyContacts.length}`,
        [
          {
            text: 'Call Now',
            onPress: () => makePhoneCall(contact.phone)
          },
          {
            text: 'Skip',
            style: 'cancel'
          }
        ]
      );
      
      // Wait for user response before next call
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log('✅ SOS activated successfully');
    return { 
      success: true, 
      location, 
      contactsNotified: emergencyContacts.length 
    };
  } catch (error) {
    console.error('❌ SOS activation error:', error);
    Alert.alert('SOS Error', 'Failed to activate SOS. Please call emergency services directly.');
    return { success: false, error: error.message };
  }
};
