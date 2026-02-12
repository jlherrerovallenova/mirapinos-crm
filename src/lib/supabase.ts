// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// En lugar de detener la app con throw, mostramos un warning en consola
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Variables de Supabase no detectadas. Verifica tu archivo .env en la raíz.');
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);
