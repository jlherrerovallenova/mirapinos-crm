// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Usamos las variables de entorno de Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 🛑 DEBUG: Verificación estricta de variables de entorno
if (!supabaseUrl) {
  console.error('❌ ERROR CRÍTICO: VITE_SUPABASE_URL no está definida en el archivo .env');
} else {
  console.log('✅ VITE_SUPABASE_URL detectada:', supabaseUrl);
}

if (!supabaseAnonKey) {
  console.error('❌ ERROR CRÍTICO: VITE_SUPABASE_ANON_KEY no está definida en el archivo .env');
} else {
  console.log('✅ VITE_SUPABASE_ANON_KEY detectada.');
}

export const supabase = createClient<Database>(
  supabaseUrl || '', 
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);