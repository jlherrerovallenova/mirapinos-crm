// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Credenciales integradas directamente para evitar bloqueos del editor web
const supabaseUrl = 'https://nbrbggvdtbvaoxsllemf.supabase.co';
const supabaseAnonKey = 'sb_publishable_Xu11tC3ME-aYxuMxVrOZdw_WVrgM2mD';

// Verificación de seguridad
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '🔴 Error Crítico: Faltan las credenciales de Supabase'
  );
}

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);