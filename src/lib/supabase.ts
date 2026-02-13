// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificación de seguridad: Detiene la app si faltan las claves
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '🔴 Error Crítico: Faltan las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el archivo .env'
  );
}

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);