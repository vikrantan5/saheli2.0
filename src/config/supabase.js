// app/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// 🔑 Your Supabase credentials
const SUPABASE_URL = "https://qhhxurqgigshrlzvmsbf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoaHh1cnFnaWdzaHJsenZtc2JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNTM0NjcsImV4cCI6MjA3NjgyOTQ2N30.ECpB-eBOY5_btjfjaCPjeDPiGDLaIalegbzz5I9FhYs";

// 🚀 Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export { SUPABASE_URL, SUPABASE_ANON_KEY };
