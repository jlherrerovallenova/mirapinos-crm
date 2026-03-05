// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase, withRetry } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { Loader as Loader2 } from 'lucide-react';

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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const isInitialMount = useRef(true);

  const fetchProfile = async (userId: string) => {
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
        console.warn('Aviso: Perfil no encontrado o error de RLS:', error.message);
        setProfile(null);
        return;
      }
      setProfile(data);
    } catch (error) {
      console.error('Error inesperado cargando el perfil:', error);
      setProfile(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session: currentSession }, error }: any = await withRetry(
          () => supabase.auth.getSession(),
          3,
          500
        );

        if (error) throw error;

        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);

          if (currentSession?.user) {
            await fetchProfile(currentSession.user.id);
          }
        }
      } catch (error: any) {
        console.error('❌ Error inicializando sesión:', error.message);
      } finally {
        if (mounted) {
          setLoading(false);
          isInitialMount.current = false;
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log('🔄 Cambio de Auth:', event);

      if (mounted) {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // Usar async block separado para evitar deadlock
        (async () => {
          try {
            if (currentSession?.user) {
              await fetchProfile(currentSession.user.id);
            } else {
              setProfile(null);
            }
          } catch (error) {
            console.error('Error cargando perfil:', error);
          }
        })();

        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
          setLoading(false);
        }
      }
    });

    initAuth();

    const fallbackTimer = setTimeout(() => {
      if (mounted && loading) {
        console.warn('⚠️ Fallback: Forzando desactivación de carga por lentitud de red.');
        setLoading(false);
      }
    }, 6000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
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
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-emerald-600 h-10 w-10" />
          <p className="text-slate-400 text-sm animate-pulse">Sincronizando con Mirapinos CRM...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};