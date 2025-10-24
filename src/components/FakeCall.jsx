import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  Vibration,
  Platform,
} from 'react-native';
import { Phone, PhoneOff, User } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { useTheme } from '@/utils/useTheme';

export default function FakeCall({ visible, onDismiss }) {
  const [callState, setState] = useState('incoming'); // incoming, accepted, ended
  const [callDuration, setCallDuration] = useState(0);
  const [sound, setSound] = useState();
  const theme = useTheme();

  const callerName = 'Mom';
  const callerNumber = '+1 (555) 123-4567';

  useEffect(() => {
    if (visible && callState === 'incoming') {
      // Start vibration pattern for incoming call
      const pattern = [1000, 1000, 1000, 1000];
      Vibration.vibrate(pattern, true);

      // Play ringtone (optional - you'd need to add a ringtone file)
      playRingtone();
    } else {
      Vibration.cancel();
    }

    return () => {
      Vibration.cancel();
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [visible, callState]);

  useEffect(() => {
    let interval;
    if (callState === 'accepted') {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  const playRingtone = async () => {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/ringtone.mp3'),
        { shouldPlay: true, isLooping: true }
      );
      setSound(newSound);
    } catch (error) {
      console.log('Ringtone error:', error);
      // Ringtone not available, that's okay
    }
  };

  const handleAcceptCall = async () => {
    Vibration.cancel();
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
    }
    setState('accepted');
    setCallDuration(0);
  };

  const handleRejectCall = async () => {
    Vibration.cancel();
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
    }
    setState('ended');
    setTimeout(() => {
      setState('incoming');
      setCallDuration(0);
      onDismiss();
    }, 1500);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onDismiss}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: callState === 'accepted' ? '#1a1a1a' : '#0a0a0a',
          paddingTop: 60,
          paddingBottom: 40,
          paddingHorizontal: 24,
        }}
      >
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 60 }}>
          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 14,
              color: '#ffffff',
              opacity: 0.6,
              marginBottom: 8,
            }}
          >
            {callState === 'incoming' && 'Incoming Call'}
            {callState === 'accepted' && formatDuration(callDuration)}
            {callState === 'ended' && 'Call Ended'}
          </Text>
        </View>

        {/* Caller Info */}
        <View style={{ alignItems: 'center', marginBottom: 80 }}>
          {/* Avatar */}
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: theme.colors.success,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 24,
            }}
          >
            <User size={60} color="#FFFFFF" strokeWidth={2} />
          </View>

          {/* Name */}
          <Text
            style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 32,
              color: '#ffffff',
              marginBottom: 8,
            }}
          >
            {callerName}
          </Text>

          {/* Number */}
          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 16,
              color: '#ffffff',
              opacity: 0.6,
            }}
          >
            {callerNumber}
          </Text>

          {/* Call Status Message */}
          {callState === 'accepted' && (
            <View
              style={{
                marginTop: 40,
                paddingHorizontal: 20,
                paddingVertical: 10,
                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                borderRadius: 20,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Inter_500Medium',
                  fontSize: 14,
                  color: '#4CAF50',
                }}
              >
                Connected
              </Text>
            </View>
          )}
        </View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Call Actions */}
        {callState === 'incoming' && (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              alignItems: 'center',
              paddingHorizontal: 40,
            }}
          >
            {/* Reject Button */}
            <TouchableOpacity
              style={{
                width: 70,
                height: 70,
                borderRadius: 35,
                backgroundColor: '#EF5350',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={handleRejectCall}
              data-testid="fake-call-reject-button"
            >
              <PhoneOff size={32} color="#FFFFFF" strokeWidth={2} />
            </TouchableOpacity>

            {/* Accept Button */}
            <TouchableOpacity
              style={{
                width: 70,
                height: 70,
                borderRadius: 35,
                backgroundColor: '#4CAF50',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={handleAcceptCall}
              data-testid="fake-call-accept-button"
            >
              <Phone size={32} color="#FFFFFF" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        )}

        {callState === 'accepted' && (
          <View style={{ alignItems: 'center' }}>
            {/* End Call Button */}
            <TouchableOpacity
              style={{
                width: 70,
                height: 70,
                borderRadius: 35,
                backgroundColor: '#EF5350',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={handleRejectCall}
              data-testid="fake-call-end-button"
            >
              <PhoneOff size={32} color="#FFFFFF" strokeWidth={2} />
            </TouchableOpacity>
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 14,
                color: '#ffffff',
                opacity: 0.6,
                marginTop: 12,
              }}
            >
              End Call
            </Text>
          </View>
        )}

        {callState === 'ended' && (
          <View style={{ alignItems: 'center' }}>
            <Text
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 18,
                color: '#ffffff',
                opacity: 0.8,
              }}
            >
              Call Ended
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}
