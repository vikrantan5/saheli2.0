// Supabase Configuration with AsyncStorage Session Persistence
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// 🔑 Get Supabase credentials from environment variables
const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || "https://etvuynlfwxbgfyaektwm.supabase.co";
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0dnV5bmxmd3hiZ2Z5YWVrdHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MDg0ODksImV4cCI6MjA3Njk4NDQ4OX0.ssC39ucwck37l-17kr-Sk9F4RStsnslGEqVjrKzuzII";

// 🚀 Initialize Supabase client with AsyncStorage for session persistence
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export { SUPABASE_URL, SUPABASE_ANON_KEY };
