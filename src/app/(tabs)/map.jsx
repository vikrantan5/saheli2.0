import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import {
  MapPin,
  Navigation,
  Shield,
  AlertTriangle,
  Eye,
  Route,
  Clock,
  Zap,
  Phone,
  Activity,
} from "lucide-react-native";
import { useTheme } from "@/utils/useTheme";
import LoadingScreen from "@/components/LoadingScreen";
import { onAuthChange } from "@/services/firebaseAuth";
import {
  getCurrentLocation,
  startLocationTracking,
  stopLocationTracking,
  isLocationTrackingActive,
} from "@/services/locationService";
import {
  getNearbyPlaces,
  getSafeRoute,
  decodePolyline,
  calculateDistance,
} from "@/services/googleMapsService";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function SafetyMapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState("safest");
  const [routePolyline, setRoutePolyline] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const theme = useTheme();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    // Check authentication
    const unsubscribe = onAuthChange((user) => {
      setIsAuthenticated(!!user);
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Initialize location and load nearby places
    initializeMap();

    return () => {
      // Clean up location tracking when component unmounts
      if (currentUser) {
        stopLocationTracking();
      }
    };
  }, [currentUser]);

  const initializeMap = async () => {
    try {
      setLoading(true);
      
      // Get current location
      const location = await getCurrentLocation();
      
      if (location) {
        setCurrentLocation(location);
        
        // Start automatic location tracking if user is authenticated
        if (currentUser) {
          await startLocationTracking(currentUser.id);
        }
        
        // Load nearby safe places
        await loadNearbyPlaces(location.latitude, location.longitude);
        
        // Center map on current location
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }, 1000);
        }
      } else {
        Alert.alert(
          'Location Required',
          'Please enable location services to use the map features.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Initialize map error:', error);
      Alert.alert('Error', 'Failed to initialize map. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadNearbyPlaces = async (latitude, longitude) => {
    try {
      setLoadingPlaces(true);
      const places = await getNearbyPlaces(latitude, longitude);
      setNearbyPlaces(places);
    } catch (error) {
      console.error('Load nearby places error:', error);
    } finally {
      setLoadingPlaces(false);
    }
  };

  const handleRouteSelect = (routeType) => {
    setSelectedRoute(routeType);
  };

  const handleStartNavigation = async () => {
    if (!currentLocation) {
      Alert.alert('Error', 'Current location not available');
      return;
    }

    // For demo, we'll use the nearest safe place as destination
    if (nearbyPlaces.length === 0) {
      Alert.alert('No Destination', 'No nearby safe places found. Please try again.');
      return;
    }

    try {
      setLoading(true);
      
      // Use first nearby place as destination
      const destination = {
        latitude: nearbyPlaces[0].latitude,
        longitude: nearbyPlaces[0].longitude,
      };

      const route = await getSafeRoute(currentLocation, destination, selectedRoute);
      
      if (route) {
        // Decode and set polyline
        const coordinates = decodePolyline(route.polyline);
        setRoutePolyline(coordinates);
        setRouteInfo(route);
        
        // Fit map to show entire route
        if (mapRef.current && coordinates.length > 0) {
          mapRef.current.fitToCoordinates(coordinates, {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          });
        }

        Alert.alert(
          'Route Calculated',
          `Distance: ${route.distance}\nEstimated time: ${route.duration}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to calculate route. Please try again.');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Error', 'Failed to start navigation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getMarkerColor = (type) => {
    switch (type) {
      case 'police':
        return theme.colors.safe;
      case 'hospital':
        return theme.colors.emergency;
      case 'fire_station':
        return theme.colors.warning;
      default:
        return theme.colors.text;
    }
  };

  const getMarkerIcon = (type) => {
    switch (type) {
      case 'police':
        return '🚔';
      case 'hospital':
        return '🏥';
      case 'fire_station':
        return '🚒';
      default:
        return '📍';
    }
  };

  if (!fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar style={theme.colors.statusBar} />

      {/* Map View */}
      <View style={{ flex: 1 }}>
        {currentLocation ? (
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={{ flex: 1 }}
            initialRegion={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            showsUserLocation={true}
            showsMyLocationButton={false}
            showsCompass={true}
            data-testid="map-view"
          >
            {/* Current Location Marker */}
            <Marker
              coordinate={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              }}
              title="Your Location"
              pinColor={theme.colors.emergency}
            />

            {/* Nearby Safe Places Markers */}
            {nearbyPlaces.map((place) => (
              <Marker
                key={place.id}
                coordinate={{
                  latitude: place.latitude,
                  longitude: place.longitude,
                }}
                title={place.name}
                description={`${place.type} • ${calculateDistance(
                  currentLocation.latitude,
                  currentLocation.longitude,
                  place.latitude,
                  place.longitude
                )} km away`}
                pinColor={getMarkerColor(place.type)}
              />
            ))}

            {/* Route Polyline */}
            {routePolyline.length > 0 && (
              <Polyline
                coordinates={routePolyline}
                strokeColor={theme.colors.emergency}
                strokeWidth={4}
              />
            )}
          </MapView>
        ) : (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: theme.colors.elevated,
            }}
          >
            <ActivityIndicator size="large" color={theme.colors.emergency} />
            <Text
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 16,
                color: theme.colors.text,
                marginTop: 16,
              }}
            >
              Loading map...
            </Text>
          </View>
        )}

        {/* Loading Overlay */}
        {loading && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.3)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        )}

        {/* Controls Overlay */}
        <View
          style={{
            position: 'absolute',
            top: insets.top + 16,
            left: 0,
            right: 0,
            paddingHorizontal: 24,
          }}
        >
          {/* Header */}
          <View
            style={{
              backgroundColor: theme.colors.elevated,
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter_600SemiBold',
                fontSize: 18,
                color: theme.colors.text,
                marginBottom: 4,
              }}
            >
              Safety Map
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Activity size={14} color={theme.colors.success} strokeWidth={2} />
              <Text
                style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 12,
                  color: theme.colors.textSecondary,
                  marginLeft: 6,
                }}
              >
                {isLocationTrackingActive() ? 'Live tracking active' : 'Tracking inactive'} • {nearbyPlaces.length} safe places nearby
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Controls */}
        <View
          style={{
            position: 'absolute',
            bottom: insets.bottom + 16,
            left: 0,
            right: 0,
            paddingHorizontal: 24,
          }}
        >
          {/* Route Info */}
          {routeInfo && (
            <View
              style={{
                backgroundColor: theme.colors.elevated,
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View>
                  <Text
                    style={{
                      fontFamily: 'Inter_500Medium',
                      fontSize: 12,
                      color: theme.colors.textSecondary,
                    }}
                  >
                    Distance
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Inter_600SemiBold',
                      fontSize: 16,
                      color: theme.colors.text,
                    }}
                  >
                    {routeInfo.distance}
                  </Text>
                </View>
                <View>
                  <Text
                    style={{
                      fontFamily: 'Inter_500Medium',
                      fontSize: 12,
                      color: theme.colors.textSecondary,
                    }}
                  >
                    Duration
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Inter_600SemiBold',
                      fontSize: 16,
                      color: theme.colors.text,
                    }}
                  >
                    {routeInfo.duration}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setRoutePolyline([]);
                    setRouteInfo(null);
                  }}
                  style={{
                    backgroundColor: theme.colors.error,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'Inter_500Medium',
                      fontSize: 12,
                      color: '#FFFFFF',
                    }}
                  >
                    Clear
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Route Type Selector */}
          <View
            style={{
              flexDirection: 'row',
              gap: 8,
              marginBottom: 12,
            }}
          >
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor:
                  selectedRoute === 'safest' ? theme.colors.safe : theme.colors.elevated,
                borderRadius: 12,
                padding: 12,
                alignItems: 'center',
              }}
              onPress={() => handleRouteSelect('safest')}
              data-testid="route-safest-button"
            >
              <Shield
                size={20}
                color={selectedRoute === 'safest' ? '#FFFFFF' : theme.colors.text}
                strokeWidth={1.5}
              />
              <Text
                style={{
                  fontFamily: 'Inter_500Medium',
                  fontSize: 11,
                  color: selectedRoute === 'safest' ? '#FFFFFF' : theme.colors.text,
                  marginTop: 4,
                }}
              >
                Safest
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor:
                  selectedRoute === 'fastest' ? theme.colors.warning : theme.colors.elevated,
                borderRadius: 12,
                padding: 12,
                alignItems: 'center',
              }}
              onPress={() => handleRouteSelect('fastest')}
              data-testid="route-fastest-button"
            >
              <Zap
                size={20}
                color={selectedRoute === 'fastest' ? '#FFFFFF' : theme.colors.text}
                strokeWidth={1.5}
              />
              <Text
                style={{
                  fontFamily: 'Inter_500Medium',
                  fontSize: 11,
                  color: selectedRoute === 'fastest' ? '#FFFFFF' : theme.colors.text,
                  marginTop: 4,
                }}
              >
                Fastest
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor:
                  selectedRoute === 'well-lit' ? theme.colors.text : theme.colors.elevated,
                borderRadius: 12,
                padding: 12,
                alignItems: 'center',
              }}
              onPress={() => handleRouteSelect('well-lit')}
              data-testid="route-well-lit-button"
            >
              <Eye
                size={20}
                color={selectedRoute === 'well-lit' ? theme.colors.background : theme.colors.text}
                strokeWidth={1.5}
              />
              <Text
                style={{
                  fontFamily: 'Inter_500Medium',
                  fontSize: 11,
                  color: selectedRoute === 'well-lit' ? theme.colors.background : theme.colors.text,
                  marginTop: 4,
                }}
              >
                Well-lit
              </Text>
            </TouchableOpacity>
          </View>

          {/* Navigation Button */}
          <TouchableOpacity
            style={{
              backgroundColor: theme.colors.success,
              borderRadius: 12,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={handleStartNavigation}
            disabled={loading || !currentLocation}
            data-testid="start-navigation-button"
          >
            <Navigation size={20} color="#FFFFFF" strokeWidth={2} />
            <Text
              style={{
                fontFamily: 'Inter_600SemiBold',
                fontSize: 16,
                color: '#FFFFFF',
                marginLeft: 8,
              }}
            >
              Navigate to Nearest Safe Place
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
