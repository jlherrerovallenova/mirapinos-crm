// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';

// Definimos un tipo para el perfil del usuario basado en tu tabla de base de datos
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

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Obteniendo perfil para el usuario:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Aviso: No se pudo obtener el perfil de la base de datos:', error.message);
        setProfile(null);
        return; // Salimos sin lanzar el error para no bloquear el inicio
      }
      
      setProfile(data);
    } catch (error) {
      console.error('Error cargando el perfil del usuario:', error);
      setProfile(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('1. Conectando con Supabase para verificar sesión...');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        console.log('2. Respuesta recibida. Sesión:', data.session ? 'Activa' : 'Inexistente');
        
        if (mounted) {
          setSession(data.session);
          setUser(data.session?.user ?? null);
          
          if (data.session?.user) {
            await fetchProfile(data.session.user.id);
          }
        }
      } catch (error: any) {
        console.error('❌ Error crítico al iniciar la sesión:', error.message || error);
      } finally {
        if (mounted) {
          console.log('3. Carga inicial completada.');
          setLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Evento de Autenticación detectado:', event);
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    });

    // MECANISMO DE SEGURIDAD (TIMEOUT)
    // Si después de 4 segundos Supabase no responde, forzamos la carga a false
    const fallbackTimer = setTimeout(() => {
      if (mounted) {
        console.warn('⚠️ TIMEOUT: La conexión a Supabase tardó demasiado. Forzando la entrada a la app...');
        setLoading(false);
      }
    }, 4000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const refreshProfile = async () => {
    if (user?.id) await fetchProfile(user.id);
  };

  const value = {
    session,
    user,
    profile,
    loading,
    signIn,
    signOut,
    refreshProfile
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 font-sans">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-emerald-600 h-10 w-10" />
          <p className="text-slate-400 text-sm animate-pulse">Conectando con la base de datos...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
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