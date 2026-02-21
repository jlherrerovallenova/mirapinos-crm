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

  /**
   * Obtiene los datos de la tabla 'profiles' para el usuario autenticado.
   * Si falla, permite continuar para no bloquear la app.
   */
  const fetchProfile = async (userId: string) => {
    try {
      console.log('Obteniendo perfil para el usuario:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Si hay un error (ej. RLS o tabla no creada), informamos pero no bloqueamos
        console.warn('Aviso: No se pudo obtener el perfil de la base de datos:', error.message);
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

    /**
     * Inicialización de la sesión al cargar la app
     */
    const initAuth = async () => {
      try {
        console.log('1. Conectando con Supabase para verificar sesión...');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (mounted) {
          const currentSession = data.session;
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          
          if (currentSession?.user) {
            await fetchProfile(currentSession.user.id);
          }
          console.log('2. Respuesta recibida. Sesión:', currentSession ? 'Activa' : 'Inexistente');
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

    /**
     * Escucha cambios en el estado de autenticación (Login, Logout, Token renovado)
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('🔄 Evento de Autenticación detectado:', event);
      
      if (mounted) {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id);
        } else {
          setProfile(null);
        }
        
        // Aseguramos que el loading termine tras un cambio de estado
        setLoading(false);
      }
    });

    /**
     * MECANISMO DE SEGURIDAD (TIMEOUT)
     * Si tras 4 segundos no hay respuesta de red, permitimos el renderizado
     * para que las rutas protegidas decidan si redirigir o no.
     */
    const fallbackTimer = setTimeout(() => {
      if (mounted && loading) {
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
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  };

  const signOut = async () => {
    setProfile(null);
    return await supabase.auth.signOut();
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

  // Pantalla de carga profesional mientras se verifica la identidad
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-emerald-600 h-10 w-10" />
          <p className="text-slate-400 text-sm animate-pulse">
            Sincronizando con Mirapinos CRM...
          </p>
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