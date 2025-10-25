import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Vibration,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  Shield,
  Phone,
  Volume2,
  MapPin,
  Users,
  AlertTriangle,
  PhoneCall,
  Mic,
  Eye,
  Activity,
} from "lucide-react-native";
import { router } from "expo-router";
import { useTheme } from "@/utils/useTheme";
import LoadingScreen from "@/components/LoadingScreen";
import ActionButton from "@/components/ActionButton";
import FakeCall from "@/components/FakeCall";
import LoudAlarm from "@/components/LoudAlarm";
// Updated to use Supabase instead of Firebase
import { onAuthChange } from "@/services/supabaseAuth";
import { activateSOS } from "@/services/supabaseSosService";
import { startLocationTracking, stopLocationTracking } from "@/services/locationService";

export default function SafetyHomeScreen() {
  const insets = useSafeAreaInsets();
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [sosCountdown, setSOSCountdown] = useState(5);
  const [safetyStatus, setSafetyStatus] = useState("Safe");
  const [nearbyResources, setNearbyResources] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showFakeCall, setShowFakeCall] = useState(false);
  const [showLoudAlarm, setShowLoudAlarm] = useState(false);
  const theme = useTheme();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    // Check authentication status and start location tracking
    const unsubscribe = onAuthChange(async (user) => {
      setIsAuthenticated(!!user);
      setCurrentUser(user);
      
      // Start automatic location tracking when user is authenticated
      if (user) {
        await startLocationTracking(user.id);
        console.log('Automatic location tracking started for user:', user.id);
      } else {
        // Stop tracking when user logs out
        stopLocationTracking();
        console.log('Location tracking stopped');
      }
    });

    return () => {
      unsubscribe();
      // Stop tracking when component unmounts
      if (currentUser) {
        stopLocationTracking();
      }
    };
  }, []);

  useEffect(() => {
    // Simulate fetching nearby safety resources
    setNearbyResources([
      { type: "Police Station", distance: "0.8 km", name: "Central Police" },
      { type: "Hospital", distance: "1.2 km", name: "City General" },
      { type: "Safe Haven", distance: "0.3 km", name: "Community Center" },
    ]);
  }, []);

  useEffect(() => {
    let interval;
    if (isSOSActive && sosCountdown > 0) {
      interval = setInterval(() => {
        setSOSCountdown(prev => prev - 1);
      }, 1000);
    } else if (isSOSActive && sosCountdown === 0) {
      handleSOSActivation();
      setIsSOSActive(false);
      setSOSCountdown(5);
    }
    return () => clearInterval(interval);
  }, [isSOSActive, sosCountdown]);

  const handleSOSPress = () => {
    if (isSOSActive) {
      // Cancel SOS
      setIsSOSActive(false);
      setSOSCountdown(5);
      return;
    }

    // Start SOS countdown
    setIsSOSActive(true);
    Vibration.vibrate([100, 200, 100]);
  };

  const handleSOSActivation = async () => {
    // Check if user is logged in
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'Please login to use SOS feature',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/login') }
        ]
      );
      return;
    }

    try {
      // Activate SOS with Firebase integration
      const result = await activateSOS();
      
      if (result.success) {
        Alert.alert(
          "SOS Activated",
          `Emergency contacts have been notified!\n${result.contactsNotified} contacts alerted.`,
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("SOS Failed", "Unable to activate SOS. Please call emergency services directly.");
      }
    } catch (error) {
      console.error('SOS activation failed:', error);
      Alert.alert("SOS Error", "Failed to activate SOS. Please call emergency services directly.");
    }
  };

  const handleFakeCall = () => {
    setShowFakeCall(true);
  };

  const handleLoudAlarm = () => {
    setShowLoudAlarm(true);
  };

  if (!fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar style={theme.colors.statusBar} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <View>
            <Text
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 24,
                color: theme.colors.text,
                marginBottom: 4,
              }}
            >
              Saheli
            </Text>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 14,
                color: theme.colors.textSecondary,
              }}
            >
              Your safety, our priority
            </Text>
          </View>

          {!isAuthenticated ? (
            <TouchableOpacity
              style={{
                backgroundColor: theme.colors.emergency,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 16,
              }}
              onPress={() => router.push('/login')}
              data-testid="home-login-button"
            >
              <Text
                style={{
                  fontFamily: "Inter_500Medium",
                  fontSize: 12,
                  color: "#FFFFFF",
                }}
              >
                Login
              </Text>
            </TouchableOpacity>
          ) : (
            <View
              style={{
                backgroundColor: theme.colors.safe,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_500Medium",
                  fontSize: 12,
                  color: "#FFFFFF",
                }}
              >
                {safetyStatus}
              </Text>
            </View>
          )}
        </View>

        {/* Main SOS Button */}
        <View style={{ alignItems: "center", marginBottom: 40 }}>
          <TouchableOpacity
            style={{
              width: 200,
              height: 200,
              borderRadius: 100,
              backgroundColor: isSOSActive ? theme.colors.warning : theme.colors.emergency,
              justifyContent: "center",
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
            onPress={handleSOSPress}
            activeOpacity={0.8}
            data-testid="home-sos-button"
          >
            {isSOSActive ? (
              <View style={{ alignItems: "center" }}>
                <Text
                  style={{
                    fontFamily: "Inter_700Bold",
                    fontSize: 36,
                    color: "#FFFFFF",
                    marginBottom: 8,
                  }}
                >
                  {sosCountdown}
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_500Medium",
                    fontSize: 12,
                    color: "#FFFFFF",
                  }}
                >
                  TAP TO CANCEL
                </Text>
              </View>
            ) : (
              <View style={{ alignItems: "center" }}>
                <Shield size={48} color="#FFFFFF" strokeWidth={2} />
                <Text
                  style={{
                    fontFamily: "Inter_700Bold",
                    fontSize: 18,
                    color: "#FFFFFF",
                    marginTop: 8,
                  }}
                >
                  SOS
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: theme.colors.textSecondary,
              textAlign: "center",
              marginTop: 16,
              lineHeight: 20,
            }}
          >
            Hold to activate emergency protocol{"\n"}
            Alerts contacts & authorities instantly
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 18,
              color: theme.colors.text,
              marginBottom: 16,
            }}
          >
            Quick Actions
          </Text>

          <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: theme.colors.elevated,
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
              }}
              onPress={handleFakeCall}
              data-testid="home-fake-call-button"
            >
              <PhoneCall size={24} color={theme.colors.text} strokeWidth={1.5} />
              <Text
                style={{
                  fontFamily: "Inter_500Medium",
                  fontSize: 12,
                  color: theme.colors.text,
                  marginTop: 8,
                  textAlign: "center",
                }}
              >
                Fake Call
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: theme.colors.elevated,
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
              }}
              onPress={handleLoudAlarm}
              data-testid="home-loud-alarm-button"
            >
              <Volume2 size={24} color={theme.colors.text} strokeWidth={1.5} />
              <Text
                style={{
                  fontFamily: "Inter_500Medium",
                  fontSize: 12,
                  color: theme.colors.text,
                  marginTop: 8,
                  textAlign: "center",
                }}
              >
                Loud Alarm
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: theme.colors.elevated,
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
              }}
              onPress={() => router.push("/(tabs)/map")}
            >
              <MapPin size={24} color={theme.colors.text} strokeWidth={1.5} />
              <Text
                style={{
                  fontFamily: "Inter_500Medium",
                  fontSize: 12,
                  color: theme.colors.text,
                  marginTop: 8,
                  textAlign: "center",
                }}
              >
                Safe Routes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: theme.colors.elevated,
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
              }}
              onPress={() => router.push("/(tabs)/community")}
            >
              <Users size={24} color={theme.colors.text} strokeWidth={1.5} />
              <Text
                style={{
                  fontFamily: "Inter_500Medium",
                  fontSize: 12,
                  color: theme.colors.text,
                  marginTop: 8,
                  textAlign: "center",
                }}
              >
                Community
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Safety Status */}
        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 18,
              color: theme.colors.text,
              marginBottom: 16,
            }}
          >
            Current Status
          </Text>

          <View
            style={{
              backgroundColor: theme.colors.elevated,
              borderRadius: 12,
              padding: 16,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: theme.colors.safe,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 12,
                }}
              >
                <Eye size={16} color="#FFFFFF" strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: "Inter_500Medium",
                    fontSize: 14,
                    color: theme.colors.text,
                  }}
                >
                  AI Monitoring: Active
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 12,
                    color: theme.colors.textSecondary,
                  }}
                >
                  Scanning environment for threats
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: theme.colors.safe,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 12,
                }}
              >
                <Activity size={16} color="#FFFFFF" strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: "Inter_500Medium",
                    fontSize: 14,
                    color: theme.colors.text,
                  }}
                >
                  Location Sharing: On
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 12,
                    color: theme.colors.textSecondary,
                  }}
                >
                  Trusted contacts can see your location
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Nearby Resources */}
        <View>
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 18,
              color: theme.colors.text,
              marginBottom: 16,
            }}
          >
            Nearby Safety Resources
          </Text>

          {nearbyResources.map((resource, index) => (
            <View key={index}>
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: theme.colors.buttonBackground,
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 12,
                  }}
                >
                  <Shield size={16} color={theme.colors.text} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: "Inter_500Medium",
                      fontSize: 14,
                      color: theme.colors.text,
                      marginBottom: 2,
                    }}
                  >
                    {resource.name}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Inter_400Regular",
                      fontSize: 12,
                      color: theme.colors.textSecondary,
                    }}
                  >
                    {resource.type} • {resource.distance}
                  </Text>
                </View>
                <Phone size={16} color={theme.colors.textSecondary} strokeWidth={1.5} />
              </TouchableOpacity>
              {index < nearbyResources.length - 1 && (
                <View
                  style={{
                    height: 1,
                    backgroundColor: theme.colors.divider,
                    marginLeft: 44,
                  }}
                />
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Fake Call Modal */}
      <FakeCall visible={showFakeCall} onDismiss={() => setShowFakeCall(false)} />

      {/* Loud Alarm Modal */}
      <LoudAlarm visible={showLoudAlarm} onDismiss={() => setShowLoudAlarm(false)} />
    </View>
  );
}