import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
// In a real app, these would be environment variables
const supabaseUrl = 'https://fqsvmzqstvbinobrnkle.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxc3ZtenFzdHZiaW5vYnJua2xlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwMzkwMjksImV4cCI6MjA1NjYxNTAyOX0.EjRxcBX-9XrY_5EFyJM8CtDuh5GOCNfHkEJN5f-HBL4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
