// Supabase Authentication Service
import { supabase } from '../config/supabase';

// Register new user with Supabase Auth and store data in PostgreSQL
export const registerUser = async (userData) => {
  try {
    const { email, password, name, address, occupation, emergencyContacts } = userData;
    
    // Step 1: Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error('Supabase Auth error:', authError);
      return { success: false, error: authError.message };
    }

    // Step 2: Ensure we have the correct user ID
    let userId = authData.user?.id;
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    }

    if (!userId) {
      return { success: false, error: 'User creation failed (no UID returned)' };
    }

    // Step 3: Store user profile data in 'users' table
    const { error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: userId, // ✅ must match auth.uid()
          email,
          name,
          address,
          occupation,
          created_at: new Date().toISOString(),
        },
      ]);

    if (userError) {
      console.error('User profile insert error:', userError);
      return { success: false, error: userError.message };
    }

    // Step 4: Insert emergency contacts
    const contactsToInsert = (emergencyContacts || []).map((contact) => ({
      user_id: userId, // ✅ must match auth.uid()
      name: contact.name,
      phone: contact.phone,
    }));

    if (contactsToInsert.length > 0) {
      const { error: contactsError } = await supabase
        .from('emergency_contacts')
        .insert(contactsToInsert);

      if (contactsError) {
        console.error('Emergency contacts insert error:', contactsError);
        return { success: false, error: contactsError.message };
      }
    }

    return { success: true, user: authData.user };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: error.message };
  }
};

// Sign in existing user
export const loginUser = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    return { success: true, user: data.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Sign out user with proper session cleanup
export const logoutUser = async () => {
  try {
    // Sign out from Supabase (this automatically clears AsyncStorage session)
    const { error } = await supabase.auth.signOut();
    if (error) return { success: false, error: error.message };
    
    // Additional cleanup if needed
    console.log('User logged out successfully');
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
};

// Get user data (profile + emergency contacts)
export const getUserData = async (userId) => {
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    const { data: contacts, error: contactsError } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', userId);

    if (contactsError) throw contactsError;

    return {
      success: true,
      data: { ...userData, emergencyContacts: contacts || [] },
    };
  } catch (error) {
    console.error('Get user data error:', error);
    return { success: false, error: error.message };
  }
};

// Get current authenticated user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return error ? null : user;
};

// Listen to auth state changes
export const onAuthChange = (callback) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
  return () => subscription.unsubscribe();
};
