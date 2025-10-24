import { Tabs } from "expo-router";
import { Shield, MapPin, Users, AlertTriangle, Settings } from "lucide-react-native";
import { useTheme } from "@/utils/useTheme";

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBarBackground,
          borderTopWidth: 1,
          borderTopColor: theme.colors.tabBarBorder,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: theme.colors.tabBarActive,
        tabBarInactiveTintColor: theme.colors.tabBarInactive,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Safety",
          tabBarIcon: ({ color, size }) => (
            <Shield color={color} size={24} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Safe Map",
          tabBarIcon: ({ color, size }) => (
            <MapPin color={color} size={24} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: "Community",
          tabBarIcon: ({ color, size }) => (
            <Users color={color} size={24} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: "Alerts",
          tabBarIcon: ({ color, size }) => (
            <AlertTriangle color={color} size={24} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Settings color={color} size={24} strokeWidth={1.5} />
          ),
        }}
      />
    </Tabs>
  );
}