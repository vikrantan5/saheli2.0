import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
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
  Plus,
  X,
} from "lucide-react-native";
import { useTheme } from "@/utils/useTheme";
import LoadingScreen from "@/components/LoadingScreen";
import ChatRoom from "@/components/ChatRoom";
import { getChatRooms, createChatRoom } from "@/services/chatService";
import { onAuthChange } from "@/services/firebaseAuth";
import { router } from "expo-router";

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showChatRoom, setShowChatRoom] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState('');
  const [newCommunityDescription, setNewCommunityDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('users');
  const [creating, setCreating] = useState(false);
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

  const availableIcons = [
    { name: 'users', component: Users, label: 'Users' },
    { name: 'message-circle', component: MessageCircle, label: 'Message' },
    { name: 'alert-triangle', component: AlertTriangle, label: 'Alert' },
    { name: 'help-circle', component: HelpCircle, label: 'Help' },
    { name: 'shield', component: Shield, label: 'Shield' },
    { name: 'heart', component: Heart, label: 'Heart' },
  ];

  const handleCreateCommunity = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'Please login to create communities',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/login') },
        ]
      );
      return;
    }
    setShowCreateModal(true);
  };

  const handleSaveNewCommunity = async () => {
    if (!newCommunityName.trim()) {
      Alert.alert('Validation Error', 'Please enter a community name');
      return;
    }
    if (!newCommunityDescription.trim()) {
      Alert.alert('Validation Error', 'Please enter a community description');
      return;
    }

    try {
      setCreating(true);
      const result = await createChatRoom(
        newCommunityName.trim(),
        newCommunityDescription.trim(),
        selectedIcon
      );

      if (result.success) {
        Alert.alert('Success', 'Community created successfully!');
        setShowCreateModal(false);
        setNewCommunityName('');
        setNewCommunityDescription('');
        setSelectedIcon('users');
        // Reload chat rooms
        loadChatRooms();
      } else {
        Alert.alert('Error', result.error || 'Failed to create community');
      }
    } catch (error) {
      console.error('Create community error:', error);
      Alert.alert('Error', 'Failed to create community');
    } finally {
      setCreating(false);
    }
  };

  const handleCancelCreate = () => {
    setShowCreateModal(false);
    setNewCommunityName('');
    setNewCommunityDescription('');
    setSelectedIcon('users');
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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 18,
                color: theme.colors.text,
              }}
            >
              Active Chat Rooms
            </Text>
            {isAuthenticated && (
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.colors.success,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                }}
                onPress={handleCreateCommunity}
                data-testid="create-community-button"
              >
                <Plus size={16} color="#FFFFFF" strokeWidth={2} />
                <Text
                  style={{
                    fontFamily: 'Inter_600SemiBold',
                    fontSize: 14,
                    color: '#FFFFFF',
                    marginLeft: 4,
                  }}
                >
                  Create
                </Text>
              </TouchableOpacity>
            )}
          </View>

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

      {/* Create Community Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelCreate}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: theme.colors.background,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 20,
              paddingBottom: insets.bottom + 20,
              paddingHorizontal: 24,
              maxHeight: '85%',
            }}
          >
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <Text
                style={{
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 20,
                  color: theme.colors.text,
                }}
              >
                Create New Community
              </Text>
              <TouchableOpacity onPress={handleCancelCreate} data-testid="close-create-modal">
                <X size={24} color={theme.colors.text} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Community Name */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontFamily: 'Inter_500Medium',
                    fontSize: 14,
                    color: theme.colors.text,
                    marginBottom: 8,
                  }}
                >
                  Community Name *
                </Text>
                <TextInput
                  style={{
                    backgroundColor: theme.colors.elevated,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontFamily: 'Inter_400Regular',
                    fontSize: 15,
                    color: theme.colors.text,
                    borderWidth: 1,
                    borderColor: theme.colors.divider,
                  }}
                  placeholder="Enter community name"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={newCommunityName}
                  onChangeText={setNewCommunityName}
                  data-testid="community-name-input"
                />
              </View>

              {/* Community Description */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontFamily: 'Inter_500Medium',
                    fontSize: 14,
                    color: theme.colors.text,
                    marginBottom: 8,
                  }}
                >
                  Description *
                </Text>
                <TextInput
                  style={{
                    backgroundColor: theme.colors.elevated,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontFamily: 'Inter_400Regular',
                    fontSize: 15,
                    color: theme.colors.text,
                    borderWidth: 1,
                    borderColor: theme.colors.divider,
                    minHeight: 80,
                    textAlignVertical: 'top',
                  }}
                  placeholder="Describe the purpose of this community"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={newCommunityDescription}
                  onChangeText={setNewCommunityDescription}
                  multiline
                  numberOfLines={3}
                  data-testid="community-description-input"
                />
              </View>

              {/* Icon Selection */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontFamily: 'Inter_500Medium',
                    fontSize: 14,
                    color: theme.colors.text,
                    marginBottom: 12,
                  }}
                >
                  Choose Icon *
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  {availableIcons.map((icon) => {
                    const IconComponent = icon.component;
                    const isSelected = selectedIcon === icon.name;
                    return (
                      <TouchableOpacity
                        key={icon.name}
                        style={{
                          width: 70,
                          height: 70,
                          borderRadius: 12,
                          backgroundColor: isSelected ? theme.colors.success : theme.colors.elevated,
                          justifyContent: 'center',
                          alignItems: 'center',
                          borderWidth: 2,
                          borderColor: isSelected ? theme.colors.success : theme.colors.divider,
                        }}
                        onPress={() => setSelectedIcon(icon.name)}
                        data-testid={`icon-${icon.name}`}
                      >
                        <IconComponent
                          size={28}
                          color={isSelected ? '#FFFFFF' : theme.colors.text}
                          strokeWidth={2}
                        />
                        <Text
                          style={{
                            fontFamily: 'Inter_400Regular',
                            fontSize: 10,
                            color: isSelected ? '#FFFFFF' : theme.colors.textSecondary,
                            marginTop: 4,
                          }}
                        >
                          {icon.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: theme.colors.elevated,
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: theme.colors.divider,
                  }}
                  onPress={handleCancelCreate}
                  disabled={creating}
                >
                  <Text
                    style={{
                      fontFamily: 'Inter_600SemiBold',
                      fontSize: 16,
                      color: theme.colors.text,
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: theme.colors.success,
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: 'center',
                  }}
                  onPress={handleSaveNewCommunity}
                  disabled={creating}
                  data-testid="save-community-button"
                >
                  {creating ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text
                      style={{
                        fontFamily: 'Inter_600SemiBold',
                        fontSize: 16,
                        color: '#FFFFFF',
                      }}
                    >
                      Create
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
