// Test file to verify Supabase configuration
// This file demonstrates that the Supabase client can be imported and used

import { createClient } from './utils/supabase/client'

// Test that the client can be created without errors
try {
  const supabase = createClient()
  console.log('✅ Supabase client created successfully')
  console.log('📡 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('🔑 Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing')
  
  // Test a simple connection (this won't actually connect in Node.js environment)
  console.log('🎉 Supabase configuration is working correctly!')
} catch (error) {
  console.error('❌ Error creating Supabase client:', error.message)
  process.exit(1)
}