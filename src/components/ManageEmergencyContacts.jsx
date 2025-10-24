import React, { useState, useEffect } from 'react';
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
import { X, Plus, Trash2, Save, Phone, User } from 'lucide-react-native';
import { useTheme } from '@/utils/useTheme';
import { supabase } from '@/config/supabase';
import { getCurrentUser } from '@/services/supabaseAuth';

export default function ManageEmergencyContacts({ visible, onClose }) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    if (visible) {
      loadContacts();
    }
  }, [visible]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in');
        onClose();
        return;
      }

      setUserId(user.id);

      // Fetch emergency contacts from Supabase
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading contacts:', error);
        Alert.alert('Error', 'Failed to load emergency contacts');
        setContacts([]);
      } else {
        setContacts(data || []);
      }
    } catch (error) {
      console.error('Load contacts error:', error);
      Alert.alert('Error', 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const addNewContact = () => {
    if (contacts.length >= 5) {
      Alert.alert('Limit Reached', 'You can add maximum 5 emergency contacts');
      return;
    }
    setContacts([...contacts, { id: `temp-${Date.now()}`, name: '', phone: '', isNew: true }]);
  };

  const updateContact = (index, field, value) => {
    const updated = [...contacts];
    updated[index][field] = value;
    setContacts(updated);
  };

  const deleteContact = async (index) => {
    const contact = contacts[index];
    
    if (contacts.length === 1) {
      Alert.alert('Cannot Delete', 'You must have at least one emergency contact');
      return;
    }

    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact.name || 'this contact'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // If it's an existing contact (not a new one), delete from database
              if (!contact.isNew && contact.id && !contact.id.startsWith('temp-')) {
                const { error } = await supabase
                  .from('emergency_contacts')
                  .delete()
                  .eq('id', contact.id);

                if (error) {
                  console.error('Delete error:', error);
                  Alert.alert('Error', 'Failed to delete contact from database');
                  return;
                }
              }

              // Remove from local state
              const updated = contacts.filter((_, i) => i !== index);
              setContacts(updated);
              Alert.alert('Success', 'Contact deleted successfully');
            } catch (error) {
              console.error('Delete contact error:', error);
              Alert.alert('Error', 'Failed to delete contact');
            }
          },
        },
      ]
    );
  };

  const saveContacts = async () => {
    try {
      // Validate all contacts
      const validContacts = contacts.filter(c => c.name.trim() && c.phone.trim());
      
      if (validContacts.length === 0) {
        Alert.alert('Validation Error', 'Please add at least one emergency contact with name and phone number');
        return;
      }

      if (validContacts.length < contacts.length) {
        Alert.alert('Validation Error', 'Please fill in all contact names and phone numbers or remove empty contacts');
        return;
      }

      setSaving(true);

      // Separate new and existing contacts
      const newContacts = validContacts.filter(c => c.isNew || c.id.startsWith('temp-'));
      const existingContacts = validContacts.filter(c => !c.isNew && !c.id.startsWith('temp-'));

      // Insert new contacts
      if (newContacts.length > 0) {
        const contactsToInsert = newContacts.map(c => ({
          user_id: userId,
          name: c.name.trim(),
          phone: c.phone.trim(),
        }));

        const { error: insertError } = await supabase
          .from('emergency_contacts')
          .insert(contactsToInsert);

        if (insertError) {
          console.error('Insert error:', insertError);
          Alert.alert('Error', 'Failed to add new contacts: ' + insertError.message);
          setSaving(false);
          return;
        }
      }

      // Update existing contacts
      for (const contact of existingContacts) {
        const { error: updateError } = await supabase
          .from('emergency_contacts')
          .update({
            name: contact.name.trim(),
            phone: contact.phone.trim(),
          })
          .eq('id', contact.id);

        if (updateError) {
          console.error('Update error:', updateError);
          Alert.alert('Error', `Failed to update ${contact.name}: ${updateError.message}`);
          setSaving(false);
          return;
        }
      }

      Alert.alert('Success', 'Emergency contacts saved successfully!');
      await loadContacts(); // Reload to get fresh data with proper IDs
    } catch (error) {
      console.error('Save contacts error:', error);
      Alert.alert('Error', 'Failed to save contacts: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <View style={{ 
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.background,
      zIndex: 1000,
    }}>
      <StatusBar style={theme.colors.statusBar} />
      
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 24,
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
          <TouchableOpacity
            onPress={onClose}
            style={{ marginRight: 16 }}
            data-testid="emergency-contacts-close-button"
          >
            <X size={24} color={theme.colors.text} strokeWidth={2} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 24,
                color: theme.colors.text,
              }}
            >
              Emergency Contacts
            </Text>
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 14,
                color: theme.colors.textSecondary,
                marginTop: 4,
              }}
            >
              Manage who gets notified in emergencies
            </Text>
          </View>
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
              Loading contacts...
            </Text>
          </View>
        ) : (
          <>
            {/* Contacts List */}
            {contacts.map((contact, index) => (
              <View
                key={contact.id || index}
                style={{
                  backgroundColor: theme.colors.elevated,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text
                    style={{
                      fontFamily: 'Inter_600SemiBold',
                      fontSize: 16,
                      color: theme.colors.text,
                    }}
                  >
                    Contact {index + 1}
                  </Text>
                  <TouchableOpacity
                    onPress={() => deleteContact(index)}
                    data-testid={`delete-contact-${index}-button`}
                  >
                    <Trash2 size={20} color={theme.colors.error} strokeWidth={2} />
                  </TouchableOpacity>
                </View>

                {/* Name Input */}
                <View style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <User size={16} color={theme.colors.textSecondary} strokeWidth={2} />
                    <Text
                      style={{
                        fontFamily: 'Inter_500Medium',
                        fontSize: 14,
                        color: theme.colors.text,
                        marginLeft: 8,
                      }}
                    >
                      Name
                    </Text>
                  </View>
                  <TextInput
                    style={{
                      backgroundColor: theme.colors.background,
                      borderRadius: 8,
                      padding: 12,
                      fontFamily: 'Inter_400Regular',
                      fontSize: 14,
                      color: theme.colors.text,
                      borderWidth: 1,
                      borderColor: theme.colors.divider,
                    }}
                    placeholder="Enter contact name"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={contact.name}
                    onChangeText={(text) => updateContact(index, 'name', text)}
                    data-testid={`contact-${index}-name-input`}
                  />
                </View>

                {/* Phone Input */}
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Phone size={16} color={theme.colors.textSecondary} strokeWidth={2} />
                    <Text
                      style={{
                        fontFamily: 'Inter_500Medium',
                        fontSize: 14,
                        color: theme.colors.text,
                        marginLeft: 8,
                      }}
                    >
                      Phone Number
                    </Text>
                  </View>
                  <TextInput
                    style={{
                      backgroundColor: theme.colors.background,
                      borderRadius: 8,
                      padding: 12,
                      fontFamily: 'Inter_400Regular',
                      fontSize: 14,
                      color: theme.colors.text,
                      borderWidth: 1,
                      borderColor: theme.colors.divider,
                    }}
                    placeholder="+1 (555) 123-4567"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={contact.phone}
                    onChangeText={(text) => updateContact(index, 'phone', text)}
                    keyboardType="phone-pad"
                    data-testid={`contact-${index}-phone-input`}
                  />
                </View>
              </View>
            ))}

            {/* Add New Contact Button */}
            {contacts.length < 5 && (
              <TouchableOpacity
                style={{
                  backgroundColor: theme.colors.elevated,
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 24,
                  borderWidth: 2,
                  borderStyle: 'dashed',
                  borderColor: theme.colors.divider,
                }}
                onPress={addNewContact}
                data-testid="add-contact-button"
              >
                <Plus size={20} color={theme.colors.success} strokeWidth={2} />
                <Text
                  style={{
                    fontFamily: 'Inter_600SemiBold',
                    fontSize: 16,
                    color: theme.colors.success,
                    marginLeft: 8,
                  }}
                >
                  Add Emergency Contact
                </Text>
              </TouchableOpacity>
            )}

            {/* Info Box */}
            <View
              style={{
                backgroundColor: theme.colors.buttonBackground,
                borderRadius: 12,
                padding: 16,
                marginBottom: 24,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Inter_500Medium',
                  fontSize: 14,
                  color: theme.colors.text,
                  marginBottom: 8,
                }}
              >
                ℹ️ Important Information
              </Text>
              <Text
                style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 12,
                  color: theme.colors.textSecondary,
                  lineHeight: 18,
                }}
              >
                • At least 1 contact is required{'\n'}
                • You can add up to 5 emergency contacts{'\n'}
                • These contacts will receive SMS and calls during SOS{'\n'}
                • Make sure phone numbers include country code
              </Text>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={{
                backgroundColor: theme.colors.success,
                borderRadius: 12,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={saveContacts}
              disabled={saving}
              data-testid="save-contacts-button"
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Save size={20} color="#FFFFFF" strokeWidth={2} />
                  <Text
                    style={{
                      fontFamily: 'Inter_600SemiBold',
                      fontSize: 16,
                      color: '#FFFFFF',
                      marginLeft: 8,
                    }}
                  >
                    Save Changes
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}
