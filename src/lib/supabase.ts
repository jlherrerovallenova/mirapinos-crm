// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase'; // Usa 'import type' para evitar conflictos de compilación

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Si faltan las variables, inicializamos con valores temporales para que no explote el JS
// pero avisamos claramente en la consola.
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERROR: No se detectan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY.');
  console.info('Asegúrate de que el archivo .env esté en la raíz del proyecto y empiece por VITE_');
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);