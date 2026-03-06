// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('❌ ERROR CRÍTICO: VITE_SUPABASE_URL no está definida en el archivo .env');
} else {
  console.log('✅ VITE_SUPABASE_URL detectada');
}

if (!supabaseAnonKey) {
  console.error('❌ ERROR CRÍTICO: VITE_SUPABASE_ANON_KEY no está definida en el archivo .env');
} else {
  console.log('✅ VITE_SUPABASE_ANON_KEY detectada');
}

// Interceptor anti-bucle temporal para Supabase Auth 
// (Protege contra el "Client Clock Drift" que causa el error net::ERR_INSUFFICIENT_RESOURCES)
let recentRefreshRequests = 0;
let lastRefreshReset = Date.now();

const customFetch = async (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
  const urlStr = url.toString();
  const now = Date.now();

  // Reset del contador de pánico cada 2 segundos
  if (now - lastRefreshReset > 2000) {
    recentRefreshRequests = 0;
    lastRefreshReset = now;
  }

  // Si Supabase intenta refrescar el token por pánico de reloj
  if (urlStr.includes('/auth/v1/token?grant_type=refresh_token')) {
    recentRefreshRequests++;

    // Si ha intentado pedir más de 3 tokens en menos de 2 segundos, ESTÁ EN BUCLE.
    if (recentRefreshRequests > 3) {
      console.error('🛑 CORTAFUEGOS: Bloqueando tormenta de refresco de tokens de Supabase (Posible desajuste de reloj local).');
      // Simulamos que el servidor nos dice "Esperad, demasiadas peticiones" sin tocar la red real
      return new Response(JSON.stringify({ error: 'rate_limit', message: 'Rate limit local enforced' }), {
        status: 429,
        statusText: 'Too Many Requests',
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Dejamos pasar la petición real al servidor
  return fetch(url, options);
};

export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      // Usamos sessionStorage para mantener la seguridad de "cerrar al salir", 
      // pero evitamos el bug críptico de autoRefreshToken + persistSession: false
      // que agota las conexiones y causa ERR_INSUFFICIENT_RESOURCES
      persistSession: true,
      storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'x-client-info': 'mirapinos-crm'
      },
      // Inyectamos nuestro escudo cortafuegos anti-bucles
      fetch: customFetch
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

export const withRetry = async <T>(
  fn: () => T | Promise<T>,
  maxRetries = 3,
  delay = 500
): Promise<T> => {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await Promise.resolve(fn());
    } catch (error: any) {
      lastError = error;
      const isNetworkError =
        error.message?.includes('NetworkError') ||
        error.message?.includes('Failed to fetch') ||
        error.code === 'NETWORK_ERROR' ||
        error.status === 0;

      if (isNetworkError && i < maxRetries - 1) {
        console.warn(`⚠️ Error de red, reintentando (${i + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      } else if (!isNetworkError) {
        throw error;
      }
    }
  }

  console.error('❌ Falló después de múltiples reintentos:', lastError);
  throw lastError;
};