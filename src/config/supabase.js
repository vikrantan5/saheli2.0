// Supabase Configuration with AsyncStorage Session Persistence
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// 🔑 Get Supabase credentials from environment variables
const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || "https://qhhxurqgigshrlzvmsbf.supabase.co";
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoaHh1cnFnaWdzaHJsenZtc2JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNTM0NjcsImV4cCI6MjA3NjgyOTQ2N30.ECpB-eBOY5_btjfjaCPjeDPiGDLaIalegbzz5I9FhYs";

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
