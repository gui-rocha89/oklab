import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://yhahrnadvnwpztpiuoed.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloYWhybmFkdm53cHp0cGl1b2VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5ODQ3NTcsImV4cCI6MjA3MzU2MDc1N30.aTQTVNdDG5hYtEEPfGZNAAqW1orlaeTXcZrRxbOzV-4"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)