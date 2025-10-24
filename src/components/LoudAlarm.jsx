import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Vibration,
  Animated,
} from 'react-native';
import { Volume2, VolumeX, AlertCircle } from 'lucide-react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/utils/useTheme';

export default function LoudAlarm({ visible, onDismiss }) {
  const [sound, setSound] = useState();
  const [isPlaying, setIsPlaying] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));
  const theme = useTheme();

  useEffect(() => {
    if (visible) {
      startAlarm();
      startPulseAnimation();
    } else {
      stopAlarm();
    }

    return () => {
      stopAlarm();
    };
  }, [visible]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startAlarm = async () => {
    try {
      // Set audio mode to play even when device is on silent
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
      });

      // Create and play alarm sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        // Use a siren/alarm sound file if available
        require('../../assets/sounds/alarm.mp3'),
        {
          shouldPlay: true,
          isLooping: true,
          volume: 1.0,
        }
      );

      setSound(newSound);
      setIsPlaying(true);

      // Start continuous vibration
      const pattern = [500, 500];
      Vibration.vibrate(pattern, true);

      // Trigger haptic feedback
      if (Haptics) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.log('Alarm error:', error);
      // Even if sound fails, keep vibration going
      setIsPlaying(true);
      Vibration.vibrate([500, 500], true);
    }
  };

  const stopAlarm = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }
      Vibration.cancel();
      setIsPlaying(false);
    } catch (error) {
      console.log('Stop alarm error:', error);
      Vibration.cancel();
      setIsPlaying(false);
    }
  };

  const handleStopAlarm = async () => {
    await stopAlarm();
    onDismiss();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={handleStopAlarm}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: '#DC143C',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
      >
        {/* Warning Icon with Pulse Animation */}
        <Animated.View
          style={{
            transform: [{ scale: pulseAnim }],
            marginBottom: 40,
          }}
        >
          <View
            style={{
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <AlertCircle size={80} color="#FFFFFF" strokeWidth={3} />
            </View>
          </View>
        </Animated.View>

        {/* Alert Text */}
        <Text
          style={{
            fontFamily: 'Inter_700Bold',
            fontSize: 36,
            color: '#FFFFFF',
            textAlign: 'center',
            marginBottom: 16,
            textTransform: 'uppercase',
            letterSpacing: 2,
          }}
        >
          EMERGENCY
        </Text>

        <Text
          style={{
            fontFamily: 'Inter_600SemiBold',
            fontSize: 24,
            color: '#FFFFFF',
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          ALARM ACTIVATED
        </Text>

        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 16,
            color: 'rgba(255, 255, 255, 0.9)',
            textAlign: 'center',
            marginBottom: 60,
            lineHeight: 24,
          }}
        >
          Maximum volume alarm is sounding{'\n'}
          to attract attention and deter threats
        </Text>

        {/* Status Indicator */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 60,
            paddingHorizontal: 24,
            paddingVertical: 12,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 24,
          }}
        >
          {isPlaying ? (
            <>
              <Volume2 size={24} color="#FFFFFF" strokeWidth={2} />
              <Text
                style={{
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 16,
                  color: '#FFFFFF',
                  marginLeft: 12,
                }}
              >
                Alarm Active
              </Text>
            </>
          ) : (
            <>
              <VolumeX size={24} color="#FFFFFF" strokeWidth={2} />
              <Text
                style={{
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 16,
                  color: '#FFFFFF',
                  marginLeft: 12,
                }}
              >
                Alarm Stopped
              </Text>
            </>
          )}
        </View>

        {/* Stop Button */}
        <TouchableOpacity
          style={{
            width: 200,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 50,
            paddingVertical: 20,
            paddingHorizontal: 40,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
          onPress={handleStopAlarm}
          data-testid="loud-alarm-stop-button"
        >
          <Text
            style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 18,
              color: '#DC143C',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            STOP ALARM
          </Text>
        </TouchableOpacity>

        {/* Safety Message */}
        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 14,
            color: 'rgba(255, 255, 255, 0.8)',
            textAlign: 'center',
            marginTop: 40,
            lineHeight: 20,
          }}
        >
          This loud alarm helps you escape{'\n'}
          dangerous situations safely
        </Text>
      </View>
    </Modal>
  );
}
