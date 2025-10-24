import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shield, ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
// Updated to use Supabase instead of Firebase
import { registerUser } from '@/services/supabaseAuth';
// OLD Firebase import (commented for backup):
// import { registerUser } from '@/services/firebaseAuth';
import { useTheme } from '@/utils/useTheme';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    address: '',
    occupation: '',
    contact1Name: '',
    contact1Phone: '',
    contact2Name: '',
    contact2Phone: '',
    contact3Name: '',
    contact3Phone: '',
  });

  const handleRegister = async () => {
    // Validation
    if (!formData.email || !formData.password || !formData.name) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (!formData.contact1Name || !formData.contact1Phone) {
      Alert.alert('Error', 'At least one emergency contact is required');
      return;
    }

    setLoading(true);

    // Prepare emergency contacts array
    const emergencyContacts = [
      { name: formData.contact1Name, phone: formData.contact1Phone },
    ];
    
    if (formData.contact2Name && formData.contact2Phone) {
      emergencyContacts.push({ name: formData.contact2Name, phone: formData.contact2Phone });
    }
    
    if (formData.contact3Name && formData.contact3Phone) {
      emergencyContacts.push({ name: formData.contact3Name, phone: formData.contact3Phone });
    }

    const userData = {
      email: formData.email,
      password: formData.password,
      name: formData.name,
      address: formData.address,
      occupation: formData.occupation,
      emergencyContacts: emergencyContacts,
    };

    const result = await registerUser(userData);
    setLoading(false);

    if (result.success) {
      Alert.alert('Success', 'Account created successfully!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } else {
      Alert.alert('Registration Failed', result.error);
    }
  };

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar style={theme.colors.statusBar} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 32 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginRight: 16 }}
            data-testid="register-back-button"
          >
            <ArrowLeft size={24} color={theme.colors.text} strokeWidth={2} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 24,
                color: theme.colors.text,
                marginBottom: 4,
              }}
            >
              Create Account
            </Text>
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 14,
                color: theme.colors.textSecondary,
              }}
            >
              Register to use Saheli safety features
            </Text>
          </View>
        </View>

        {/* Account Info */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: theme.colors.text, marginBottom: 12 }}>
            Account Information
          </Text>
          
          <TextInput
            style={{
              backgroundColor: theme.colors.elevated,
              borderRadius: 12,
              padding: 16,
              fontFamily: 'Inter_400Regular',
              fontSize: 14,
              color: theme.colors.text,
              marginBottom: 12,
            }}
            placeholder="Email"
            placeholderTextColor={theme.colors.textSecondary}
            value={formData.email}
            onChangeText={(text) => updateFormData('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
            data-testid="register-email-input"
          />

          <TextInput
            style={{
              backgroundColor: theme.colors.elevated,
              borderRadius: 12,
              padding: 16,
              fontFamily: 'Inter_400Regular',
              fontSize: 14,
              color: theme.colors.text,
              marginBottom: 12,
            }}
            placeholder="Password"
            placeholderTextColor={theme.colors.textSecondary}
            value={formData.password}
            onChangeText={(text) => updateFormData('password', text)}
            secureTextEntry
            data-testid="register-password-input"
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
            placeholder="Confirm Password"
            placeholderTextColor={theme.colors.textSecondary}
            value={formData.confirmPassword}
            onChangeText={(text) => updateFormData('confirmPassword', text)}
            secureTextEntry
            data-testid="register-confirm-password-input"
          />
        </View>

        {/* Personal Info */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: theme.colors.text, marginBottom: 12 }}>
            Personal Information
          </Text>
          
          <TextInput
            style={{
              backgroundColor: theme.colors.elevated,
              borderRadius: 12,
              padding: 16,
              fontFamily: 'Inter_400Regular',
              fontSize: 14,
              color: theme.colors.text,
              marginBottom: 12,
            }}
            placeholder="Full Name *"
            placeholderTextColor={theme.colors.textSecondary}
            value={formData.name}
            onChangeText={(text) => updateFormData('name', text)}
            data-testid="register-name-input"
          />

          <TextInput
            style={{
              backgroundColor: theme.colors.elevated,
              borderRadius: 12,
              padding: 16,
              fontFamily: 'Inter_400Regular',
              fontSize: 14,
              color: theme.colors.text,
              marginBottom: 12,
            }}
            placeholder="Address"
            placeholderTextColor={theme.colors.textSecondary}
            value={formData.address}
            onChangeText={(text) => updateFormData('address', text)}
            data-testid="register-address-input"
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
            placeholder="Occupation"
            placeholderTextColor={theme.colors.textSecondary}
            value={formData.occupation}
            onChangeText={(text) => updateFormData('occupation', text)}
            data-testid="register-occupation-input"
          />
        </View>

        {/* Emergency Contacts */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: theme.colors.text, marginBottom: 8 }}>
            Emergency Contacts *
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: theme.colors.textSecondary, marginBottom: 12 }}>
            Add at least one emergency contact
          </Text>

          {/* Contact 1 */}
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: theme.colors.text, marginBottom: 8 }}>
              Contact 1 *
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.colors.elevated,
                borderRadius: 12,
                padding: 16,
                fontFamily: 'Inter_400Regular',
                fontSize: 14,
                color: theme.colors.text,
                marginBottom: 8,
              }}
              placeholder="Name"
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.contact1Name}
              onChangeText={(text) => updateFormData('contact1Name', text)}
              data-testid="register-contact1-name-input"
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
              placeholder="Phone Number"
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.contact1Phone}
              onChangeText={(text) => updateFormData('contact1Phone', text)}
              keyboardType="phone-pad"
              data-testid="register-contact1-phone-input"
            />
          </View>

          {/* Contact 2 */}
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: theme.colors.text, marginBottom: 8 }}>
              Contact 2 (Optional)
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.colors.elevated,
                borderRadius: 12,
                padding: 16,
                fontFamily: 'Inter_400Regular',
                fontSize: 14,
                color: theme.colors.text,
                marginBottom: 8,
              }}
              placeholder="Name"
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.contact2Name}
              onChangeText={(text) => updateFormData('contact2Name', text)}
              data-testid="register-contact2-name-input"
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
              placeholder="Phone Number"
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.contact2Phone}
              onChangeText={(text) => updateFormData('contact2Phone', text)}
              keyboardType="phone-pad"
              data-testid="register-contact2-phone-input"
            />
          </View>

          {/* Contact 3 */}
          <View>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: theme.colors.text, marginBottom: 8 }}>
              Contact 3 (Optional)
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.colors.elevated,
                borderRadius: 12,
                padding: 16,
                fontFamily: 'Inter_400Regular',
                fontSize: 14,
                color: theme.colors.text,
                marginBottom: 8,
              }}
              placeholder="Name"
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.contact3Name}
              onChangeText={(text) => updateFormData('contact3Name', text)}
              data-testid="register-contact3-name-input"
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
              placeholder="Phone Number"
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.contact3Phone}
              onChangeText={(text) => updateFormData('contact3Phone', text)}
              keyboardType="phone-pad"
              data-testid="register-contact3-phone-input"
            />
          </View>
        </View>

        {/* Register Button */}
        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.emergency,
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
            marginTop: 8,
          }}
          onPress={handleRegister}
          disabled={loading}
          data-testid="register-submit-button"
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
              Create Account
            </Text>
          )}
        </TouchableOpacity>

        {/* Login Link */}
        <TouchableOpacity
          style={{ alignItems: 'center', marginTop: 16 }}
          onPress={() => router.push('/login')}
          data-testid="register-goto-login-button"
        >
          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 14,
              color: theme.colors.textSecondary,
            }}
          >
            Already have an account?{' '}
            <Text style={{ color: theme.colors.emergency, fontFamily: 'Inter_600SemiBold' }}>
              Login
            </Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
