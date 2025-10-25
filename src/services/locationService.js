// Live Location Tracking Service
import * as Location from 'expo-location';
import { supabase } from '../config/supabase';
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
          // Update location in Supabase
          const { error } = await supabase
            .from('user_locations')
            .upsert({
              user_id: userId,
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              accuracy: location.coords.accuracy,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id'
            });

          if (error) {
            console.error('Error updating location:', error);
          } else {
            console.log('Location updated successfully');
          }
        } catch (error) {
          console.error('Location update error:', error);
        }
      }
    );

    isTracking = true;
    console.log('Location tracking started');
    return true;
  } catch (error) {
    console.error('Start location tracking error:', error);
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

// Get user's shared location from Supabase
export const getUserLocation = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_locations')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user location:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Get user location error:', error);
    return null;
  }
};

// Get all trusted contacts' locations
export const getTrustedContactsLocations = async (userId) => {
  try {
    // First get emergency contacts
    const { data: contacts, error: contactsError } = await supabase
      .from('emergency_contacts')
      .select('user_id')
      .eq('user_id', userId);

    if (contactsError) {
      console.error('Error fetching contacts:', contactsError);
      return [];
    }

    // Then get their locations
    const contactIds = contacts.map(c => c.user_id);
    
    const { data: locations, error: locationsError } = await supabase
      .from('user_locations')
      .select('*')
      .in('user_id', contactIds);

    if (locationsError) {
      console.error('Error fetching locations:', locationsError);
      return [];
    }

    return locations || [];
  } catch (error) {
    console.error('Get trusted contacts locations error:', error);
    return [];
  }
};

export const isLocationTrackingActive = () => isTracking;
