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

/**
 * Custom fetch implementando Exponential Backoff (Retry Logic).
 * Proporciona resiliencia frente a micro-cortes, rate limiting (429) 
 * y reinicios de la API de Supabase (5xx).
 */
const customFetchWithRetry = async (
  input: RequestInfo | URL,
  init?: RequestInit,
  retries = 3,
  backoff = 500
): Promise<Response> => {
  try {
    const response = await fetch(input, init);
    
    // Si la respuesta no es OK y es un error temporal (5xx o 429), forzamos un reintento
    if (!response.ok && (response.status >= 500 || response.status === 429) && retries > 0) {
      console.warn(`⚠️ Supabase API Warning (Status ${response.status}). Reintentando en ${backoff}ms...`);
      throw new Error(`Transient server error: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      // Espera asíncrona (Backoff exponencial)
      await new Promise((resolve) => setTimeout(resolve, backoff));
      // Llamada recursiva disminuyendo reintentos y duplicando el tiempo de espera
      return customFetchWithRetry(input, init, retries - 1, backoff * 2);
    }
    
    // Si agotamos los reintentos, registramos el error crítico para debug y propagamos
    console.error('❌ Falla crítica de conexión a Supabase tras múltiples reintentos:', error);
    throw error;
  }
};

export const supabase = createClient<Database>(
  supabaseUrl || '', 
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      // Inyectamos nuestro custom fetch para manejar la resiliencia de la red
      fetch: customFetchWithRetry,
    },
    realtime: {
      // Optimización de la conexión WebSocket para evitar cierres silenciosos por inactividad
      heartbeatIntervalMs: 15000, // Envía un ping cada 15s para mantener el socket vivo
      timeout: 30000,             // Cierra y reconecta si no hay respuesta en 30s
    }
  }
); 