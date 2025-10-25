import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
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
import {
  MessageCircle,
  AlertTriangle,
  Heart,
  Users,
  HelpCircle,
  Shield,
  ChevronRight,
} from "lucide-react-native";
import { useTheme } from "@/utils/useTheme";
import LoadingScreen from "@/components/LoadingScreen";
import ChatRoom from "@/components/ChatRoom";
import { getChatRooms } from "@/services/chatService";
import { onAuthChange } from "@/services/supabaseAuth";
import { router } from "expo-router";

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showChatRoom, setShowChatRoom] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    loadChatRooms();
  }, []);

  const loadChatRooms = async () => {
    try {
      setLoading(true);
      const rooms = await getChatRooms();
      setChatRooms(rooms);
    } catch (error) {
      console.error('Failed to load chat rooms:', error);
      Alert.alert('Error', 'Failed to load chat rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleRoomPress = (room) => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'Please login to join chat rooms',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/login') },
        ]
      );
      return;
    }

    setSelectedRoom(room);
    setShowChatRoom(true);
  };

  const handleCloseChatRoom = () => {
    setShowChatRoom(false);
    setSelectedRoom(null);
  };

  const getRoomIcon = (iconName) => {
    switch (iconName) {
      case 'alert-triangle':
        return AlertTriangle;
      case 'help-circle':
        return HelpCircle;
      case 'shield':
        return Shield;
      default:
        return MessageCircle;
    }
  };

  const getRoomColor = (iconName) => {
    switch (iconName) {
      case 'alert-triangle':
        return theme.colors.warning;
      case 'help-circle':
        return theme.colors.emergency;
      case 'shield':
        return theme.colors.safe;
      default:
        return theme.colors.text;
    }
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
          paddingBottom: insets.bottom + 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 24,
              color: theme.colors.text,
              marginBottom: 4,
            }}
          >
            Community Hub
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: theme.colors.textSecondary,
            }}
          >
            Join real-time chat rooms and connect with others
          </Text>
        </View>

        {/* Info Card */}
        {!isAuthenticated && (
          <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
            <View
              style={{
                backgroundColor: theme.colors.elevated,
                borderRadius: 12,
                padding: 16,
                borderLeftWidth: 4,
                borderLeftColor: theme.colors.emergency,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 16,
                  color: theme.colors.text,
                  marginBottom: 8,
                }}
              >
                Login Required
              </Text>
              <Text
                style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 14,
                  color: theme.colors.textSecondary,
                  marginBottom: 12,
                }}
              >
                Please login to join chat rooms and connect with the community
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: theme.colors.emergency,
                  borderRadius: 8,
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  alignSelf: 'flex-start',
                }}
                onPress={() => router.push('/login')}
                data-testid="community-login-button"
              >
                <Text
                  style={{
                    fontFamily: 'Inter_600SemiBold',
                    fontSize: 14,
                    color: '#FFFFFF',
                  }}
                >
                  Login Now
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Chat Rooms List */}
        <View style={{ paddingHorizontal: 24 }}>
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 18,
              color: theme.colors.text,
              marginBottom: 16,
            }}
          >
            Active Chat Rooms
          </Text>

          {loading ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <ActivityIndicator size="large" color={theme.colors.emergency} />
              <Text
                style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 14,
                  color: theme.colors.textSecondary,
                  marginTop: 16,
                }}
              >
                Loading chat rooms...
              </Text>
            </View>
          ) : chatRooms.length === 0 ? (
            <View
              style={{
                alignItems: 'center',
                paddingVertical: 40,
              }}
            >
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: theme.colors.buttonBackground,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <Users size={28} color={theme.colors.textSecondary} strokeWidth={1.5} />
              </View>
              <Text
                style={{
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 18,
                  color: theme.colors.text,
                  marginBottom: 8,
                }}
              >
                No chat rooms available
              </Text>
              <Text
                style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 14,
                  color: theme.colors.textSecondary,
                  textAlign: 'center',
                }}
              >
                Chat rooms will appear here
              </Text>
            </View>
          ) : (
            chatRooms.map((room, index) => {
              const RoomIcon = getRoomIcon(room.icon);
              const roomColor = getRoomColor(room.icon);

              return (
                <TouchableOpacity
                  key={room.id}
                  style={{
                    backgroundColor: theme.colors.elevated,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                  onPress={() => handleRoomPress(room)}
                  activeOpacity={0.7}
                  data-testid={`chat-room-${index}`}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: roomColor + '20',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 16,
                    }}
                  >
                    <RoomIcon size={24} color={roomColor} strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: 'Inter_600SemiBold',
                        fontSize: 16,
                        color: theme.colors.text,
                        marginBottom: 4,
                      }}
                    >
                      {room.name}
                    </Text>
                    <Text
                      style={{
                        fontFamily: 'Inter_400Regular',
                        fontSize: 13,
                        color: theme.colors.textSecondary,
                        lineHeight: 18,
                      }}
                    >
                      {room.description}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={theme.colors.textSecondary} strokeWidth={2} />
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Guidelines */}
        <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
          <Text
            style={{
              fontFamily: 'Inter_600SemiBold',
              fontSize: 18,
              color: theme.colors.text,
              marginBottom: 16,
            }}
          >
            Community Guidelines
          </Text>
          <View
            style={{
              backgroundColor: theme.colors.elevated,
              borderRadius: 12,
              padding: 16,
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 14,
                color: theme.colors.textSecondary,
                lineHeight: 20,
              }}
            >
              • Be respectful and supportive{`\n`}
              • Share safety tips and information{`\n`}
              • Help others in need{`\n`}
              • Report inappropriate content{`\n`}
              • Protect your privacy and others'{`\n`}
              • Use anonymous mode when needed
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Chat Room Modal */}
      {showChatRoom && selectedRoom && (
        <ChatRoom
          visible={showChatRoom}
          room={selectedRoom}
          onClose={handleCloseChatRoom}
        />
      )}
    </View>
  );
}
