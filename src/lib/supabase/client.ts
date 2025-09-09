import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ukjadselhcmwwwtfkuqy.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVramFkc2VsaGNtd3d3dGZrdXF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMjI0MDUsImV4cCI6MjA3Mjc5ODQwNX0.WJb1ZLlRDzrZxeIYDPIN1giPz58SOQFsKH0uyWUnA-k'
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
