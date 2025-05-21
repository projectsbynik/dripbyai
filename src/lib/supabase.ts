import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required environment variables');
  throw new Error('Supabase configuration error: Missing required environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storageKey: 'projectz-auth',
    detectSessionInUrl: false,
    flowType: 'implicit',
    // Disable rate limiting during development
    rateLimit: {
      enabled: false
    }
  },
  global: {
    headers: {
      'x-application-name': 'projectz',
      'x-application-version': '0.0.1',
      'x-client-info': 'projectz-web'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  httpOptions: {
    fetch: fetch.bind(globalThis)
  }
});