import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Send, X, User, Shield } from 'lucide-react-native';
import { useTheme } from '@/utils/useTheme';
import {
  getRoomMessages,
  sendMessage,
  subscribeToRoomMessages,
  unsubscribeFromRoom,
} from '@/services/chatService';
import { getCurrentUser } from '@/services/supabaseAuth';

export default function ChatRoom({ visible, room, onClose }) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const scrollViewRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const subscriptionRef = useRef(null);

  useEffect(() => {
    if (visible && room) {
      initializeChat();
    }

    return () => {
      // Cleanup subscription
      if (subscriptionRef.current) {
        unsubscribeFromRoom(subscriptionRef.current);
      }
    };
  }, [visible, room]);

  const initializeChat = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'Please login to use chat');
        onClose();
        return;
      }
      setCurrentUser(user);

      // Load existing messages
      const existingMessages = await getRoomMessages(room.id);
      setMessages(existingMessages);

      // Subscribe to new messages
      subscriptionRef.current = subscribeToRoomMessages(room.id, (newMessage) => {
        setMessages((prev) => [...prev, newMessage]);
        // Scroll to bottom when new message arrives
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      });
    } catch (error) {
      console.error('Initialize chat error:', error);
      Alert.alert('Error', 'Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    try {
      setSending(true);
      const result = await sendMessage(room.id, currentUser.id, messageText, isAnonymous);
      
      if (result.success) {
        setMessageText('');
        // Scroll to bottom after sending
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        Alert.alert('Error', 'Failed to send message');
      }
    } catch (error) {
      console.error('Send message error:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (!visible) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: theme.colors.background,
        zIndex: 2000,
      }}
    >
      <StatusBar style={theme.colors.statusBar} />
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + 12,
            paddingBottom: 12,
            paddingHorizontal: 16,
            backgroundColor: theme.colors.elevated,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.divider,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <TouchableOpacity onPress={onClose} style={{ marginRight: 12 }} data-testid="chat-back-button">
            <ArrowLeft size={24} color={theme.colors.text} strokeWidth={2} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: 'Inter_600SemiBold',
                fontSize: 18,
                color: theme.colors.text,
              }}
            >
              {room?.name || 'Chat Room'}
            </Text>
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 12,
                color: theme.colors.textSecondary,
              }}
            >
              {room?.description || 'Community chat'}
            </Text>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 16,
          }}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
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
                Loading messages...
              </Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text
                style={{
                  fontFamily: 'Inter_500Medium',
                  fontSize: 16,
                  color: theme.colors.textSecondary,
                }}
              >
                No messages yet
              </Text>
              <Text
                style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 14,
                  color: theme.colors.textSecondary,
                  marginTop: 8,
                  textAlign: 'center',
                }}
              >
                Be the first to send a message!
              </Text>
            </View>
          ) : (
            messages.map((msg, index) => {
              const isOwnMessage = msg.user_id === currentUser?.id;
              const showUsername = !isOwnMessage && (!messages[index - 1] || messages[index - 1].user_id !== msg.user_id);
              
              return (
                <View
                  key={msg.id}
                  style={{
                    marginBottom: 12,
                    alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
                  }}
                >
                  {/* Username (for others' messages) */}
                  {showUsername && !msg.is_anonymous && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, marginLeft: 8 }}>
                      <User size={12} color={theme.colors.textSecondary} strokeWidth={2} />
                      <Text
                        style={{
                          fontFamily: 'Inter_500Medium',
                          fontSize: 12,
                          color: theme.colors.textSecondary,
                          marginLeft: 4,
                        }}
                      >
                        {msg.users?.name || 'User'}
                      </Text>
                    </View>
                  )}
                  
                  {showUsername && msg.is_anonymous && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, marginLeft: 8 }}>
                      <Shield size={12} color={theme.colors.warning} strokeWidth={2} />
                      <Text
                        style={{
                          fontFamily: 'Inter_500Medium',
                          fontSize: 12,
                          color: theme.colors.warning,
                          marginLeft: 4,
                        }}
                      >
                        Anonymous
                      </Text>
                    </View>
                  )}

                  {/* Message Bubble */}
                  <View
                    style={{
                      maxWidth: '75%',
                      backgroundColor: isOwnMessage ? theme.colors.emergency : theme.colors.elevated,
                      borderRadius: 16,
                      borderTopRightRadius: isOwnMessage ? 4 : 16,
                      borderTopLeftRadius: isOwnMessage ? 16 : 4,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'Inter_400Regular',
                        fontSize: 15,
                        color: isOwnMessage ? '#FFFFFF' : theme.colors.text,
                        lineHeight: 20,
                      }}
                    >
                      {msg.message}
                    </Text>
                    <Text
                      style={{
                        fontFamily: 'Inter_400Regular',
                        fontSize: 11,
                        color: isOwnMessage ? 'rgba(255,255,255,0.7)' : theme.colors.textSecondary,
                        marginTop: 4,
                        textAlign: 'right',
                      }}
                    >
                      {formatTime(msg.created_at)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Input Area */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            paddingBottom: insets.bottom + 12,
            backgroundColor: theme.colors.elevated,
            borderTopWidth: 1,
            borderTopColor: theme.colors.divider,
          }}
        >
          {/* Anonymous Toggle */}
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 8,
            }}
            onPress={() => setIsAnonymous(!isAnonymous)}
            data-testid="anonymous-toggle"
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                borderWidth: 2,
                borderColor: isAnonymous ? theme.colors.success : theme.colors.divider,
                backgroundColor: isAnonymous ? theme.colors.success : 'transparent',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 8,
              }}
            >
              {isAnonymous && <Text style={{ color: '#FFFFFF', fontSize: 12 }}>✓</Text>}
            </View>
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 14,
                color: theme.colors.text,
              }}
            >
              Send as anonymous
            </Text>
          </TouchableOpacity>

          {/* Message Input */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              style={{
                flex: 1,
                backgroundColor: theme.colors.background,
                borderRadius: 24,
                paddingHorizontal: 16,
                paddingVertical: 10,
                fontFamily: 'Inter_400Regular',
                fontSize: 15,
                color: theme.colors.text,
                marginRight: 8,
                maxHeight: 100,
              }}
              placeholder="Type a message..."
              placeholderTextColor={theme.colors.textSecondary}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              data-testid="message-input"
            />
            <TouchableOpacity
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: messageText.trim() ? theme.colors.emergency : theme.colors.disabled,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={handleSendMessage}
              disabled={!messageText.trim() || sending}
              data-testid="send-message-button"
            >
              {sending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Send size={20} color="#FFFFFF" strokeWidth={2} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
