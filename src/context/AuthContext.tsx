import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase, withRetry } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { Loader2, AlertCircle, XCircle } from 'lucide-react';

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'agent' | 'viewer';
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Diagnóstico visual en pantalla
  const [authError, setAuthError] = useState<{ title: string; message: string } | null>(null);

  // Control de refrescos para evitar bucles infinitos (net::ERR_INSUFFICIENT_RESOURCES)
  const lastProfileFetchRef = useRef<number>(0);
  const isFetchingRef = useRef<boolean>(false);

  const fetchProfile = async (userId: string, retries = 2) => {
    // Si ya estamos buscando, o buscamos hace menos de 2 segundos, ignoramos para no spammar.
    const now = Date.now();
    if (isFetchingRef.current || (now - lastProfileFetchRef.current < 2000)) {
      console.log('⏳ fetchProfile omitido (debounce o fetch en progreso).');
      return;
    }

    isFetchingRef.current = true;
    lastProfileFetchRef.current = now;

    try {
      const { data, error } = await withRetry(
        () => supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle(),
        3,
        500
      );

      if (error) {
        // Ignorar el AbortError si quedan reintentos (es un bug del navegador/adblock)
        if (error.message?.includes('AbortError') && retries > 0) {
          console.warn(`⏳ AbortError detectado. Reintentando en 1s... (Quedan ${retries})`);
          isFetchingRef.current = false;
          setTimeout(() => fetchProfile(userId, retries - 1), 1000);
          return;
        }

        console.warn('Aviso: Perfil no encontrado o error de API:', error.message);
        setAuthError({ title: 'Error de Conexión (Perfil)', message: error.message });
        setProfile(null);
        return;
      }
      setProfile(data);
    } catch (error: any) {
      if (error.message?.includes('AbortError') && retries > 0) {
        console.warn(`⏳ Catch AbortError detectado. Reintentando en 1s... (Quedan ${retries})`);
        isFetchingRef.current = false;
        setTimeout(() => fetchProfile(userId, retries - 1), 1000);
        return;
      }

      console.error('Error inesperado cargando el perfil:', error);
      setAuthError({ title: 'Fallo de Red Crítico', message: error.message || 'No se pudo contactar con Supabase.' });
      setProfile(null);
    } finally {
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Respetar tiempo razonable de carga pero sin forzar modal de error
    const maxLoadingTimer = setTimeout(() => {
      if (mounted) {
        console.warn('⚠️ La conexión inicial con Supabase está tardando más de lo esperado.');
      }
    }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('🔄 Cambio de Auth:', event, currentSession?.user?.email || 'Sin usuario');

      if (!mounted) return;

      const previousSession = sessionRef.current;
      sessionRef.current = currentSession;

      // Detección de caída de sesión
      if (event === 'SIGNED_OUT' && previousSession && !currentSession) {
        setAuthError({
          title: 'Sesión Perdida',
          message: 'Supabase ha reseteado la conexión. Esto suele ocurrir si la hora de Windows es incorrecta o el navegador borra el almacenamiento local.'
        });
      }

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        await fetchProfile(currentSession.user.id);
      } else {
        setProfile(null);
      }

      // Finish loading once we receive literally any initial status.
      if (
        event === 'INITIAL_SESSION' ||
        event === 'SIGNED_IN' ||
        event === 'SIGNED_OUT' ||
        event === 'TOKEN_REFRESHED'
      ) {
        clearTimeout(maxLoadingTimer);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(maxLoadingTimer);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setAuthError(null);
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    setProfile(null);
    return await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user?.id) await fetchProfile(user.id);
  };

  const value = { session, user, profile, loading, signIn, signOut, refreshProfile };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 relative">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-emerald-600 h-10 w-10" />
          <p className="text-slate-400 text-sm animate-pulse">Sincronizando con Mirapinos CRM...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {authError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] w-[90%] max-w-md bg-red-600 text-white p-4 rounded-xl shadow-2xl flex gap-4 animate-in slide-in-from-top-4">
          <AlertCircle className="shrink-0" size={24} />
          <div className="flex-1">
            <h3 className="font-bold text-lg leading-tight mb-1">{authError.title}</h3>
            <p className="text-sm text-red-100">{authError.message}</p>
          </div>
          <button onClick={() => setAuthError(null)} className="text-red-200 hover:text-white shrink-0 self-start p-1 transition-colors">
            <XCircle size={20} />
          </button>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};