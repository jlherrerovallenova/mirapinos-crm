// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.https://nbrbggvdtbvaoxsllemf.supabase.co;
const supabaseAnonKey = import.meta.env.sb_publishable_Xu11tC3ME-aYxuMxVrOZdw_WVrgM2mD;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);