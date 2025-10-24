import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shield, ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
// Updated to use Supabase instead of Firebase
import { loginUser } from '@/services/supabaseAuth';
// OLD Firebase import (commented for backup):
// import { loginUser } from '@/services/firebaseAuth';
import { useTheme } from '@/utils/useTheme';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    const result = await loginUser(email, password);
    setLoading(false);

    if (result.success) {
      Alert.alert('Success', 'Logged in successfully!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } else {
      Alert.alert('Login Failed', result.error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar style={theme.colors.statusBar} />

      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 16,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 24,
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 48 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginRight: 16 }}
            data-testid="login-back-button"
          >
            <ArrowLeft size={24} color={theme.colors.text} strokeWidth={2} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 28,
                color: theme.colors.text,
                marginBottom: 4,
              }}
            >
              Welcome Back
            </Text>
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 14,
                color: theme.colors.textSecondary,
              }}
            >
              Login to access your safety features
            </Text>
          </View>
        </View>

        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: theme.colors.emergency,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Shield size={40} color="#FFFFFF" strokeWidth={2} />
          </View>
          <Text
            style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 24,
              color: theme.colors.text,
            }}
          >
            Saheli
          </Text>
        </View>

        {/* Login Form */}
        <View style={{ marginBottom: 24 }}>
          <TextInput
            style={{
              backgroundColor: theme.colors.elevated,
              borderRadius: 12,
              padding: 16,
              fontFamily: 'Inter_400Regular',
              fontSize: 14,
              color: theme.colors.text,
              marginBottom: 16,
            }}
            placeholder="Email"
            placeholderTextColor={theme.colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            data-testid="login-email-input"
          />

          <TextInput
            style={{
              backgroundColor: theme.colors.elevated,
              borderRadius: 12,
              padding: 16,
              fontFamily: 'Inter_400Regular',
              fontSize: 14,
              color: theme.colors.text,
            }}
            placeholder="Password"
            placeholderTextColor={theme.colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            data-testid="login-password-input"
          />
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.emergency,
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
            marginBottom: 16,
          }}
          onPress={handleLogin}
          disabled={loading}
          data-testid="login-submit-button"
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              style={{
                fontFamily: 'Inter_600SemiBold',
                fontSize: 16,
                color: '#FFFFFF',
              }}
            >
              Login
            </Text>
          )}
        </TouchableOpacity>

        {/* Register Link */}
        <TouchableOpacity
          style={{ alignItems: 'center' }}
          onPress={() => router.push('/register')}
          data-testid="login-goto-register-button"
        >
          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 14,
              color: theme.colors.textSecondary,
            }}
          >
            Don't have an account?{' '}
            <Text style={{ color: theme.colors.emergency, fontFamily: 'Inter_600SemiBold' }}>
              Register
            </Text>
          </Text>
        </TouchableOpacity>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Info */}
        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 12,
            color: theme.colors.textSecondary,
            textAlign: 'center',
          }}
        >
          By logging in, you agree to use Saheli's{'\n'}safety features responsibly
        </Text>
      </View>
    </View>
  );
}
