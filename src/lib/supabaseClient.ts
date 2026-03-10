import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://egjvcxywrifspxlxfgwx.supabase.co'
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnanZjeHl3cmlmc3B4bHhmZ3d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4OTIzNDIsImV4cCI6MjA4NzQ2ODM0Mn0.tkxC9kb5oMckIhV-z-h2vA0OK8n2Os6vFb5UNDJdT3M'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
