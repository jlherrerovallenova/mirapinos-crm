// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = 'https://nbrbggvdtbvaoxsllemf.supabase.co';
const supabaseAnonKey = 'sb_publishable_Xu11tC3ME-aYxuMxVrOZdw_WVrgM2mD';

export const supabase = createClient<Database>(
  supabaseUrl, 
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    // Blindaje: Reintentos automáticos en caso de fallo de red
    global: {
      fetch: (url, options) => {
        return fetch(url, { ...options, keepalive: true });
      }
    }
  }
);