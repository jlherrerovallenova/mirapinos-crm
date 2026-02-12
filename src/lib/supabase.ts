// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// CAMBIO CRÍTICO AQUÍ: Agrega 'import type'
import type { Database } from '../types/supabase'; 

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Usamos console.error en lugar de throw para no congelar la pantalla blanca si falla la config
  console.error('⚠️ Faltan credenciales de Supabase en .env');
}

export const supabase = createClient<Database>(
  supabaseUrl || '', 
  supabaseAnonKey || ''
);