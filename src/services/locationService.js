// Live Location Tracking Service
import * as Location from 'expo-location';
import firestore from '@react-native-firebase/firestore';
import { Alert } from 'react-native';

let locationSubscription = null;
let isTracking = false;

// Request location permissions
export const requestLocationPermissions = async () => {
  try {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    
    if (foregroundStatus !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'Location permission is required for safety features to work properly.',
        [{ text: 'OK' }]
      );
      return false;
    }

    // Request background location for continuous tracking
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    
    if (backgroundStatus !== 'granted') {
      console.warn('Background location permission denied');
      // Still return true as foreground is sufficient for basic functionality
    }

    return true;
  } catch (error) {
    console.error('Location permission error:', error);
    return false;
  }
};

// Get current location once
export const getCurrentLocation = async () => {
  try {
    const hasPermission = await requestLocationPermissions();
    if (!hasPermission) return null;

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      timestamp: location.timestamp,
    };
  } catch (error) {
    console.error('Get current location error:', error);
    return null;
  }
};

// Start continuous location tracking
export const startLocationTracking = async (userId) => {
  try {
    if (isTracking) {
      console.log('Location tracking already active');
      return true;
    }

    const hasPermission = await requestLocationPermissions();
    if (!hasPermission) return false;

    // Start watching location with high accuracy
    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 30000, // Update every 30 seconds
        distanceInterval: 50, // Or when moved 50 meters
      },
      async (location) => {
        try {
          // Update location in Firestore
          await firestore()
            .collection('user_locations')
            .doc(userId)
            .set({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              accuracy: location.coords.accuracy,
              updated_at: firestore.FieldValue.serverTimestamp(),
            }, { merge: true });

          console.log('✅ Location updated successfully');
        } catch (error) {
          console.error('❌ Error updating location:', error);
        }
      }
    );

    isTracking = true;
    console.log('✅ Location tracking started');
    return true;
  } catch (error) {
    console.error('❌ Start location tracking error:', error);
    return false;
  }
};

// Stop location tracking
export const stopLocationTracking = () => {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
    isTracking = false;
    console.log('Location tracking stopped');
  }
};

// Get user's shared location from Firestore
export const getUserLocation = async (userId) => {
  try {
    const doc = await firestore()
      .collection('user_locations')
      .doc(userId)
      .get();

    if (!doc.exists) {
      console.log('No location data found for user');
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
      updated_at: doc.data().updated_at?.toDate()
    };
  } catch (error) {
    console.error('❌ Get user location error:', error);
    return null;
  }
};

// Get all trusted contacts' locations
export const getTrustedContactsLocations = async (userId) => {
  try {
    // First get emergency contacts
    const contactsSnapshot = await firestore()
      .collection('emergency_contacts')
      .where('user_id', '==', userId)
      .get();

    if (contactsSnapshot.empty) {
      console.log('No emergency contacts found');
      return [];
    }

    // Extract user IDs from contacts
    const contactUserIds = contactsSnapshot.docs.map(doc => doc.data().user_id);
    
    if (contactUserIds.length === 0) {
      return [];
    }

    // Get locations for these users
    // Note: Firestore 'in' query supports up to 10 items
    const locations = [];
    
    for (const contactUserId of contactUserIds) {
      const locationDoc = await firestore()
        .collection('user_locations')
        .doc(contactUserId)
        .get();
      
      if (locationDoc.exists) {
        locations.push({
          id: locationDoc.id,
          ...locationDoc.data(),
          updated_at: locationDoc.data().updated_at?.toDate()
        });
      }
    }

    return locations;
  } catch (error) {
    console.error('❌ Get trusted contacts locations error:', error);
    return [];
  }
};

export const isLocationTrackingActive = () => isTracking;
